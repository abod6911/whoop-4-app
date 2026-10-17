import { localDateKey } from '../utils/dateKey';

export interface PedometerState {
  steps: number;
  cadence: number; // steps per minute
  source: 'imu_hardware' | 'activity_inference';
  lastStepTimestamp: number;
  activeMovementMinutes: number;
}

export class PedometerEngine {
  private steps = 0;
  private cadence = 0;
  private source: 'imu_hardware' | 'activity_inference' = 'activity_inference';
  private lastStepTimestamp = 0;
  private recentStepTimestamps: number[] = [];

  // IMU DSP Filtering & Dynamic Thresholding
  private accelWindow: number[] = [];
  private readonly windowSize = 50; // ~1-2 seconds of accelerometer data
  private lastPeakTime = 0;
  // Human rhythmic locomotion: 0.8 Hz (1250 ms) to 3.2 Hz (312 ms)
  private readonly minStepIntervalMs = 312; // 3.2 Hz (~192 steps/min max human bipedal cadence)
  private readonly maxStepIntervalMs = 1250; // 0.8 Hz (~48 steps/min min human strolling cadence)
  private dynamicThreshold = 1.15; // in G's

  // HR-Inference Model State
  private lastHrTickTime = Date.now();
  private accumulatedStepFraction = 0;
  private activeSeconds = 0;

  constructor() {
    this.loadPersistedSteps();
  }

  private getTodayKey(): string {
    return localDateKey();
  }

  private loadPersistedSteps(): void {
    try {
      const saved = localStorage.getItem(`whoop_steps_${this.getTodayKey()}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.steps = parsed.steps || 0;
        this.source = parsed.source || 'activity_inference';
      }
    } catch {
      this.steps = 0;
    }
  }

  private persistSteps(): void {
    try {
      localStorage.setItem(
        `whoop_steps_${this.getTodayKey()}`,
        JSON.stringify({
          steps: this.steps,
          source: this.source,
          updatedAt: Date.now(),
        })
      );
    } catch {}
  }

  // --- 1. Real Hardware IMU Stream Ingestion ---
  public ingestRawAccel(x: number, y: number, z: number, timestamp = Date.now(), onWrist = true): void {
    if (!onWrist) {
      this.cadence = 0;
      return;
    }

    this.source = 'imu_hardware';

    // 1. Vector Magnitude (in Gs or m/s^2 normalized)
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    this.accelWindow.push(magnitude);
    if (this.accelWindow.length > this.windowSize) {
      this.accelWindow.shift();
    }

    // 2. Dynamic Threshold calculation (rolling mean + adaptive factor)
    if (this.accelWindow.length >= 15) {
      const sum = this.accelWindow.reduce((a, b) => a + b, 0);
      const mean = sum / this.accelWindow.length;
      const variance = this.accelWindow.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.accelWindow.length;
      const stdDev = Math.sqrt(variance);

      // Adaptive threshold for distinguishing heel-strikes from ambient noise
      this.dynamicThreshold = mean + Math.max(0.18, stdDev * 0.75);

      // 3. Peak detection with strict human locomotion frequency (0.8 Hz - 3.2 Hz)
      const currentIndex = this.accelWindow.length - 2;
      if (currentIndex > 0) {
        const prev = this.accelWindow[currentIndex - 1];
        const curr = this.accelWindow[currentIndex];
        const next = this.accelWindow[currentIndex + 1];

        const interval = timestamp - this.lastPeakTime;
        if (
          curr > prev &&
          curr > next &&
          curr > this.dynamicThreshold &&
          interval >= this.minStepIntervalMs &&
          interval <= this.maxStepIntervalMs
        ) {
          this.recordStep(timestamp);
          this.lastPeakTime = timestamp;
        }
      }
    }

    this.pruneCadenceWindow(timestamp);
  }

  // --- 2. Fallback: Activity-Cadence Inference Model from Heart Rate ---
  public ingestHeartRate(bpm: number, zone: number, timestamp = Date.now(), onWrist = true): void {
    // If band is off wrist or heart rate is null/zero, freeze pedometer accrual
    if (!onWrist || !bpm || bpm <= 0) {
      this.cadence = 0;
      return;
    }

    // If real hardware IMU has delivered samples in the last 10 seconds, prioritize hardware IMU
    if (this.source === 'imu_hardware' && timestamp - this.lastStepTimestamp < 10000) {
      return;
    }

    const elapsedSec = Math.min(5, Math.max(0.2, (timestamp - this.lastHrTickTime) / 1000));
    this.lastHrTickTime = timestamp;

    if (zone >= 1) {
      this.activeSeconds += elapsedSec;
    }

    // Cadence inference by heart rate zone
    let inferredCadence = 0;
    if (zone === 0) {
      inferredCadence = 0; // Resting/Stationary
    } else if (zone === 1) {
      // Light active movement / recovery stroll: 75-95 steps/min
      inferredCadence = 85;
    } else if (zone === 2) {
      // Steady aerobic walk/light jog: 110-125 steps/min
      inferredCadence = 118;
    } else if (zone === 3) {
      // Moderate tempo run/jog: 140-155 steps/min
      inferredCadence = 148;
    } else if (zone === 4) {
      // High threshold run: 160-172 steps/min
      inferredCadence = 166;
    } else if (zone === 5) {
      // Max intensity sprint/HIIT: 175-185 steps/min
      inferredCadence = 180;
    }

    this.cadence = inferredCadence;

    if (inferredCadence > 0) {
      const stepsPerSec = inferredCadence / 60.0;
      this.accumulatedStepFraction += stepsPerSec * elapsedSec;

      if (this.accumulatedStepFraction >= 1.0) {
        const addedSteps = Math.floor(this.accumulatedStepFraction);
        this.accumulatedStepFraction -= addedSteps;
        this.steps += addedSteps;
        this.lastStepTimestamp = timestamp;

        if (this.steps % 20 === 0) {
          this.persistSteps();
        }
      }
    }
  }

  private recordStep(timestamp: number): void {
    this.steps++;
    this.lastStepTimestamp = timestamp;
    this.recentStepTimestamps.push(timestamp);
    this.pruneCadenceWindow(timestamp);

    if (this.steps % 10 === 0) {
      this.persistSteps();
    }
  }

  private pruneCadenceWindow(timestamp: number): void {
    const windowStart = timestamp - 10000; // 10-second rolling window
    this.recentStepTimestamps = this.recentStepTimestamps.filter((t) => t >= windowStart);

    if (this.recentStepTimestamps.length >= 2) {
      const stepsInWindow = this.recentStepTimestamps.length;
      this.cadence = Math.round((stepsInWindow / 10) * 60);
    } else if (timestamp - this.lastStepTimestamp > 3000) {
      this.cadence = 0;
    }
  }

  public getState(): PedometerState {
    return {
      steps: this.steps,
      cadence: this.cadence,
      source: this.source,
      lastStepTimestamp: this.lastStepTimestamp,
      activeMovementMinutes: Math.round(this.activeSeconds / 60),
    };
  }

  public resetTodaySteps(): void {
    this.steps = 0;
    this.cadence = 0;
    this.accumulatedStepFraction = 0;
    this.activeSeconds = 0;
    this.persistSteps();
  }
}

export const pedometerEngine = new PedometerEngine();
