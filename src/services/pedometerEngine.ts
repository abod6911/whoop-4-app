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
  private activeSeconds = 0;
  private subscribers = new Set<(state: PedometerState) => void>();
  // Motion listener state
  private isMotionListenerActive = false;
  public isWalkSimulationActive = false;

  constructor() {
    this.loadPersistedSteps();
    this.initDeviceMotionListener();
    if (typeof window !== 'undefined') {
      const handleUserGesture = () => {
        this.requestMotionPermission().catch(() => {});
        window.removeEventListener('click', handleUserGesture);
        window.removeEventListener('touchstart', handleUserGesture);
      };
      window.addEventListener('click', handleUserGesture, { once: true });
      window.addEventListener('touchstart', handleUserGesture, { once: true });
    }
  }

  public async requestMotionPermission(): Promise<boolean> {
    if (typeof (DeviceMotionEvent as any)?.requestPermission === 'function') {
      try {
        const state = await (DeviceMotionEvent as any).requestPermission();
        if (state === 'granted') {
          this.initDeviceMotionListener();
          return true;
        }
      } catch {
        return false;
      }
    }
    return true;
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

  public get dailySteps(): number {
    return this.steps;
  }

  public set dailySteps(targetSteps: number) {
    this.setDailySteps(targetSteps);
  }

  public setDailySteps(targetSteps: number, source: 'imu_hardware' | 'activity_inference' = 'imu_hardware'): void {
    const sanitized = Math.max(0, Math.round(targetSteps));
    this.steps = sanitized;
    this.lastStepTimestamp = Date.now();
    this.source = source;
    this.persistSteps();
    this.notifySubscribers(this.steps);
  }

  public notifySubscribers(_stepsCount?: number): void {
    const state = this.getState();
    this.subscribers.forEach((cb) => {
      try {
        cb(state);
      } catch (err) {
        console.error('[PedometerEngine] Subscriber notification error:', err);
      }
    });
  }

  public reloadForUser(): void {
    this.isWalkSimulationActive = false;
    this.cadence = 0;
    this.activeSeconds = 0;
    this.recentStepTimestamps = [];
    this.loadPersistedSteps();
    this.notifySubscribers(this.steps);
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
    if (this.accelWindow.length >= 6) {
      const sum = this.accelWindow.reduce((a, b) => a + b, 0);
      const mean = sum / this.accelWindow.length;
      const variance = this.accelWindow.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.accelWindow.length;
      const stdDev = Math.sqrt(variance);

      // Adaptive threshold for human wrist / arm locomotion: 0.04g to 0.30g above baseline
      const adaptiveCandidate = mean + Math.max(0.04, stdDev * 0.45);
      this.dynamicThreshold = Math.min(1.30, Math.max(1.05, adaptiveCandidate));

      // 3. Peak detection with dynamic debounce window (220ms - 300ms)
      const currentIndex = this.accelWindow.length - 2;
      if (currentIndex > 0) {
        const prev = this.accelWindow[currentIndex - 1];
        const curr = this.accelWindow[currentIndex];
        const next = this.accelWindow[currentIndex + 1];

        const debounceMs = this.cadence > 130 ? 220 : 280;
        const interval = timestamp - this.lastPeakTime;
        const isNewStreak = this.lastPeakTime === 0 || interval > 2500;

        if (
          curr > prev &&
          curr > next &&
          curr >= this.dynamicThreshold &&
          (isNewStreak || interval >= debounceMs)
        ) {
          this.recordStep(timestamp);
          this.lastPeakTime = timestamp;
        }
      }
    }

    this.pruneCadenceWindow(timestamp);
  }

  // --- 2. Activity Time Tracker (Zero Fake HR-to-Step Ingestion) ---
  public ingestHeartRate(bpm: number, zone: number, timestamp = Date.now(), onWrist = true, _rhrBase = 60): void {
    if (!onWrist || !bpm || bpm <= 0) {
      if (!onWrist && this.cadence > 0) {
        this.cadence = 0;
        this.notifySubscribers();
      }
      return;
    }

    const elapsedSec = Math.min(3, Math.max(0.1, (timestamp - this.lastHrTickTime) / 1000));
    this.lastHrTickTime = timestamp;

    if (zone >= 1 || bpm >= 88) {
      this.activeSeconds += elapsedSec;
    }

    // STRICT HEALTH-TECH SPEC:
    // Physical steps must come strictly from hardware IMU peak detection or RSC cumulative packets.
    // We strictly DO NOT synthesize artificial steps from Heart Rate.
    if (timestamp - this.lastStepTimestamp > 3000 && this.cadence > 0) {
      this.cadence = 0;
      this.notifySubscribers();
    }
  }

  public setLiveCadence(cadence: number): void {
    this.cadence = Math.max(0, Math.round(cadence));
    this.notifySubscribers();
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
  public simulateStepBurst(count = 50): void {
    this.steps += count;
    this.cadence = 114;
    this.lastStepTimestamp = Date.now();
    this.source = 'imu_hardware';
    this.persistSteps();
    this.notifySubscribers(this.steps);
  }

  public toggleContinuousWalk(forceActive?: boolean): boolean {
    const nextState = forceActive !== undefined ? forceActive : !this.isWalkSimulationActive;
    this.isWalkSimulationActive = nextState;
    if (!nextState) {
      this.cadence = 0;
    }
    this.notifySubscribers(this.steps);
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
   * Commits the entire target count immediately and in one transaction into IndexedDB and reactive state.
   */
  public reconcileCumulativeHardwareSteps(hardwareDailyTotal: number): number {
    const target = Math.max(0, Math.round(hardwareDailyTotal));
    if (target > 0 && target !== this.steps) {
      const delta = target - this.steps;
      this.steps = target;
      this.lastStepTimestamp = Date.now();
      this.source = 'imu_hardware';
      this.persistSteps();
      this.notifySubscribers(this.steps);
      return Math.max(0, delta);
    }
    return 0;
  }

  /**
   * Process historical minute-by-minute IMU/cadence buffer offloaded from strap:
   * Delta Steps = Sum ( Cadence_epoch * Delta_t )
   * Deduplicates by checking epoch timestamps before appending.
   * Commits full delta immediately in one bulk transaction.
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
      this.notifySubscribers(this.steps);
    }
    return deltaSteps;
  }

  /**
   * Add a known offline step delta directly in one bulk transaction
   */
  public addOfflineStepDelta(
    delta: number,
    source: 'imu_hardware' | 'activity_inference' = 'imu_hardware'
  ): void {
    if (delta <= 0) return;
    this.steps += Math.round(delta);
    this.lastStepTimestamp = Date.now();
    this.source = source;
    this.persistSteps();
    this.notifySubscribers(this.steps);
  }

  /**
   * Reconnect after outdoor walk without phone: commits full bulk delta immediately
   */
  public simulateOfflineWalkReconnection(additionalSteps = 2000): number {
    this.steps += Math.round(additionalSteps);
    this.lastStepTimestamp = Date.now();
    this.source = 'imu_hardware';
    this.persistSteps();
    this.notifySubscribers(this.steps);
    return additionalSteps;
  }

  public reconcileOfflineSteps(additionalSteps = 2000): number {
    return this.simulateOfflineWalkReconnection(additionalSteps);
  }

  public resetTodaySteps(): void {
    this.steps = 0;
    this.cadence = 0;
    this.activeSeconds = 0;
    this.recentStepTimestamps = [];
    this.persistSteps();
    this.notifySubscribers(this.steps);
  }
}

export const pedometerEngine = new PedometerEngine();
