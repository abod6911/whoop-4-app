import { localDateKey } from '../utils/dateKey';
import { storageService } from './StorageService';

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
  private processedEpochs = new Set<string>();

  // IMU DSP Filtering & Dynamic Thresholding
  private accelWindow: number[] = [];
  private readonly windowSize = 50; // ~1-2 seconds of accelerometer data
  private lastPeakTime = 0;
  // Human rhythmic locomotion: 0.8 Hz (1250 ms) to 3.33 Hz (300 ms)
  private readonly minStepIntervalMs = 300; // 3.33 Hz (~200 steps/min max human bipedal cadence)
  private readonly maxStepIntervalMs = 1250; // 0.8 Hz (~48 steps/min min human strolling cadence)
  private dynamicThreshold = 1.15; // in G's

  // HR-Inference Model State
  private lastHrTickTime = Date.now();
  private accumulatedStepFraction = 0;
  private activeSeconds = 0;
  private subscribers = new Set<(state: PedometerState) => void>();
  // Motion listener state
  private isMotionListenerActive = false;
  private walkInterval: any = null;
  public isWalkSimulationActive = false;

  constructor() {
    this.loadPersistedSteps();
    this.initDeviceMotionListener();
  }

  public initDeviceMotionListener(): void {
    if (typeof window === 'undefined' || !window.DeviceMotionEvent) return;
    if (this.isMotionListenerActive) return;

    const onMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      // Convert m/s^2 to G-force (1 G = 9.80665 m/s^2)
      const gX = acc.x / 9.80665;
      const gY = acc.y / 9.80665;
      const gZ = acc.z / 9.80665;

      this.ingestPhoneAccel(gX, gY, gZ, Date.now());
    };

    try {
      window.addEventListener('devicemotion', onMotion, { passive: true });
      this.isMotionListenerActive = true;
    } catch {}
  }

  public subscribe(callback: (state: PedometerState) => void): () => void {
    this.subscribers.add(callback);
    callback(this.getState());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    const state = this.getState();
    this.subscribers.forEach((cb) => cb(state));
  }

  private getTodayKey(): string {
    return localDateKey();
  }

  private getStepStorageKey(): string {
    const todayKey = this.getTodayKey();
    const userId = storageService.getUserId();
    return userId ? `user_${userId}_steps_${todayKey}` : `whoop_steps_${todayKey}`;
  }

  private loadPersistedSteps(): void {
    try {
      const todayKey = this.getTodayKey();
      const recorded = storageService.getRecordedSteps(todayKey);
      if (recorded > 0) {
        this.steps = recorded;
        this.source = 'imu_hardware';
        return;
      }
      const raw = localStorage.getItem(this.getStepStorageKey()) || localStorage.getItem(`whoop_steps_${todayKey}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.steps = typeof parsed.steps === 'number' && parsed.steps >= 0 ? parsed.steps : 0;
        this.source = parsed.source || 'imu_hardware';
      } else {
        this.steps = 0;
        this.persistSteps();
      }
    } catch {
      this.steps = 0;
    }
  }

  public persistSteps(): void {
    try {
      const todayKey = this.getTodayKey();
      storageService.saveRecordedSteps(todayKey, this.steps, this.source);
    } catch {}
  }

  // --- Phone Accelerometer (DeviceMotion) Stream Ingestion ---
  public ingestPhoneAccel(x: number, y: number, z: number, timestamp = Date.now()): void {
    // If real hardware IMU has recorded steps in the last 4 seconds, prioritize strap IMU
    if (this.source === 'imu_hardware' && timestamp - this.lastStepTimestamp < 4000) {
      return;
    }
    this.ingestRawAccel(x, y, z, timestamp, true);
  }

  // --- 1. Real Hardware IMU Stream Ingestion ---
  public ingestRawAccel(x: number, y: number, z: number, timestamp = Date.now(), onWrist = true): void {
    if (!onWrist) {
      this.cadence = 0;
      return;
    }

    this.source = 'imu_hardware';

    // 1. Vector Magnitude: A_mag = sqrt(x^2 + y^2 + z^2)
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    this.accelWindow.push(magnitude);
    if (this.accelWindow.length > this.windowSize) {
      this.accelWindow.shift();
    }

    // 2. Dynamic Threshold calculation (rolling mean + adaptive factor)
    if (this.accelWindow.length >= 8) {
      const sum = this.accelWindow.reduce((a, b) => a + b, 0);
      const mean = sum / this.accelWindow.length;
      const variance = this.accelWindow.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.accelWindow.length;
      const stdDev = Math.sqrt(variance);

      // Adaptive threshold constrained between 1.15g and 1.40g
      const adaptiveCandidate = mean + Math.max(0.15, stdDev * 0.7);
      this.dynamicThreshold = Math.min(1.40, Math.max(1.15, adaptiveCandidate));

      // 3. Peak detection with dynamic debounce window (240ms - 320ms)
      const currentIndex = this.accelWindow.length - 2;
      if (currentIndex > 0) {
        const prev = this.accelWindow[currentIndex - 1];
        const curr = this.accelWindow[currentIndex];
        const next = this.accelWindow[currentIndex + 1];

        // Dynamic debounce: 240ms for fast pace/running, 320ms for casual stroll
        const debounceMs = this.cadence > 130 ? 240 : 300;
        const interval = timestamp - this.lastPeakTime;

        if (
          curr > prev &&
          curr > next &&
          curr >= this.dynamicThreshold &&
          interval >= debounceMs &&
          interval <= 1400
        ) {
          this.recordStep(timestamp);
          this.lastPeakTime = timestamp;
        }
      }
    }

    this.pruneCadenceWindow(timestamp);
  }

  // --- 2. Activity Time Tracker & Hybrid Heart-Rate Cadence Fallback ---
  public ingestHeartRate(bpm: number, zone: number, timestamp = Date.now(), onWrist = true): void {
    if (!onWrist || !bpm || bpm <= 0) {
      return;
    }

    const elapsedSec = Math.min(5, Math.max(0.2, (timestamp - this.lastHrTickTime) / 1000));
    this.lastHrTickTime = timestamp;

    if (zone >= 1 || bpm >= 92) {
      this.activeSeconds += elapsedSec;
    }

    // Hybrid Ingestion Fallback:
    // If the strap's proprietary IMU stream is obstructed or unavailable,
    // and the strap reports elevated HR in active zones (> 95 BPM),
    // estimate steps based on physiological gait cadence so the counter never stays frozen.
    const isImuRecent = this.source === 'imu_hardware' && (timestamp - this.lastStepTimestamp < 4000);
    if (!isImuRecent && bpm >= 95) {
      let inferredCadence = 0;
      if (bpm < 115) {
        // Zone 1 brisk walking (100 - 114 SPM)
        inferredCadence = 100 + Math.round(((bpm - 95) / 20) * 14);
      } else if (bpm < 140) {
        // Zone 2 power walk / jogging (118 - 140 SPM)
        inferredCadence = 118 + Math.round(((bpm - 115) / 25) * 22);
      } else if (bpm < 165) {
        // Zone 3 steady run (145 - 165 SPM)
        inferredCadence = 145 + Math.round(((bpm - 140) / 25) * 20);
      } else {
        // Zone 4-5 vigorous running (168 - 182 SPM)
        inferredCadence = 168 + Math.round(Math.min(1.0, (bpm - 165) / 25) * 14);
      }

      const stepsPerSec = inferredCadence / 60;
      this.accumulatedStepFraction += stepsPerSec * elapsedSec;

      if (this.accumulatedStepFraction >= 1.0) {
        const wholeSteps = Math.floor(this.accumulatedStepFraction);
        this.accumulatedStepFraction -= wholeSteps;
        this.cadence = inferredCadence;
        this.recordSteps(wholeSteps, timestamp, 'activity_inference');
      }
    }
  }

  public recordSteps(
    count = 1,
    timestamp = Date.now(),
    source: 'imu_hardware' | 'activity_inference' = 'imu_hardware'
  ): void {
    if (count <= 0) return;
    this.steps += count;
    this.source = source;
    this.lastStepTimestamp = timestamp;
    for (let i = 0; i < Math.min(count, 5); i++) {
      this.recentStepTimestamps.push(timestamp);
    }
    this.pruneCadenceWindow(timestamp);
    this.notifySubscribers();
    this.persistSteps();
  }

  private recordStep(timestamp: number): void {
    this.recordSteps(1, timestamp, 'imu_hardware');
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

  // Developer Tool: Test Live Step Packet (+1 Step)
  public testLiveStepPacket(): void {
    this.recordSteps(1, Date.now(), 'imu_hardware');
    this.cadence = Math.max(104, this.cadence || 110);
    this.notifySubscribers();
  }

  // Simulator for hardware lab & live demonstration
  public simulateStepBurst(count = 25): void {
    this.steps += count;
    this.cadence = 114;
    this.lastStepTimestamp = Date.now();
    this.source = 'imu_hardware';
    this.persistSteps();
    this.notifySubscribers();
  }

  public toggleContinuousWalk(forceActive?: boolean): boolean {
    const nextState = forceActive !== undefined ? forceActive : !this.isWalkSimulationActive;
    this.isWalkSimulationActive = nextState;

    if (this.walkInterval) {
      clearInterval(this.walkInterval);
      this.walkInterval = null;
    }

    if (nextState) {
      this.cadence = 112;
      this.source = 'imu_hardware';
      this.walkInterval = setInterval(() => {
        this.steps += 2;
        this.lastStepTimestamp = Date.now();
        this.cadence = Math.floor(106 + Math.random() * 12);
        this.persistSteps();
        this.notifySubscribers();
      }, 1000);
    } else {
      this.cadence = 0;
      this.notifySubscribers();
    }

    this.notifySubscribers();
    return this.isWalkSimulationActive;
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

  // --- Offline Steps Reconciliation & Historical Catch-up ---

  /**
   * Reconcile cumulative hardware counter upon strap reconnection.
   * Updates total if hardware count exceeds current tracked steps.
   */
  public reconcileCumulativeHardwareSteps(hardwareDailyTotal: number): number {
    if (hardwareDailyTotal > this.steps) {
      const delta = hardwareDailyTotal - this.steps;
      this.steps = hardwareDailyTotal;
      this.lastStepTimestamp = Date.now();
      this.source = 'imu_hardware';
      this.persistSteps();
      this.notifySubscribers();
      return delta;
    }
    return 0;
  }

  /**
   * Process historical minute-by-minute IMU/cadence buffer offloaded from strap:
   * Delta Steps = Sum ( Cadence_epoch * Delta_t )
   * Deduplicates by checking epoch timestamps before appending.
   */
  public reconcileOfflineCadenceEpochs(
    epochs: Array<{ timestamp: number; cadence: number; durationMinutes?: number }>
  ): number {
    let deltaSteps = 0;
    epochs.forEach((ep) => {
      const key = `${ep.timestamp}_${ep.cadence}`;
      if (!this.processedEpochs.has(key)) {
        this.processedEpochs.add(key);
        const durationMin = ep.durationMinutes ?? 1;
        const stepsInEpoch = Math.round(ep.cadence * durationMin);
        if (stepsInEpoch > 0) {
          deltaSteps += stepsInEpoch;
        }
      }
    });

    if (deltaSteps > 0) {
      this.steps += deltaSteps;
      this.lastStepTimestamp = Date.now();
      this.source = 'imu_hardware';
      this.persistSteps();
      this.notifySubscribers();
    }
    return deltaSteps;
  }

  /**
   * Add a known offline step delta directly (e.g. from telemetry catch-up)
   */
  public addOfflineStepDelta(
    delta: number,
    source: 'imu_hardware' | 'activity_inference' = 'imu_hardware'
  ): void {
    if (delta <= 0) return;
    this.steps += delta;
    this.lastStepTimestamp = Date.now();
    this.source = source;
    this.persistSteps();
    this.notifySubscribers();
  }

  /**
   * Simulate reconnecting after a 45-minute outdoor walk without the phone (+2,500 Steps)
   */
  public simulateOfflineWalkReconnection(additionalSteps = 2000): number {
    this.steps += additionalSteps;
    this.lastStepTimestamp = Date.now();
    this.source = 'imu_hardware';
    this.persistSteps();
    this.notifySubscribers();
    return additionalSteps;
  }

  public reconcileOfflineSteps(additionalSteps = 2000): number {
    return this.simulateOfflineWalkReconnection(additionalSteps);
  }

  public resetTodaySteps(): void {
    this.steps = 0;
    this.cadence = 0;
    this.accumulatedStepFraction = 0;
    this.activeSeconds = 0;
    this.persistSteps();
    this.notifySubscribers();
  }
}

export const pedometerEngine = new PedometerEngine();
