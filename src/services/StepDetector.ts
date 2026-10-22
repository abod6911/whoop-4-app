/**
 * StepDetector.ts
 * 
 * Embedded Health-Tech DSP Step Detection Engine for 3-axis Accelerometer Telemetry.
 * Features:
 *  - Signal Vector Magnitude: SVM = sqrt(x^2 + y^2 + z^2)
 *  - Exponential Moving Average (EMA) smoothing (ALPHA = 0.25)
 *  - Slope transition peak detection (previousSlope > 0 && currentSlope <= 0)
 *  - Acceleration thresholding (>= 1.22 G)
 *  - Physiological refractory window gating (240 ms to 1200 ms: 50 - 250 SPM)
 * 
 * Operates purely on raw physical telemetry with zero synthetic tickers or timer intervals.
 */

export interface AccelSample {
  x: number; // in G units (1.0 = ~9.80665 m/s^2)
  y: number; // in G units
  z: number; // in G units
  timestamp?: number; // millisecond Unix timestamp
}

export class StepDetector {
  private steps: number = 0;
  private cadence: number = 0; // Steps per minute (SPM)

  // Filter & Detection Constants
  private readonly ALPHA: number = 0.25;
  private readonly MIN_THRESHOLD_G: number = 1.22;
  private readonly MIN_REFRACTORY_MS: number = 240; // ~250 SPM sprint ceiling
  private readonly MAX_REFRACTORY_MS: number = 1200; // ~50 SPM slow stroll floor

  // DSP Internal State
  private smoothedSVM: number = 0;
  private previousSmoothedSVM: number = 0;
  private previousSlope: number = 0;
  private isInitialized: boolean = false;
  private lastStepTimestamp: number = 0;
  private recentStepTimestamps: number[] = [];
  private subscribers: Set<(steps: number, cadence: number) => void> = new Set();

  constructor(initialSteps = 0) {
    this.steps = Math.max(0, Math.round(initialSteps));
  }

  /**
   * Process a single 3-axis accelerometer sample.
   * Returns true if a genuine physical step was detected on this sample.
   */
  public processSample(sample: AccelSample): boolean {
    const { x, y, z } = sample;
    const timestamp = sample.timestamp ?? Date.now();

    // 1. Signal Vector Magnitude: SVM = sqrt(x^2 + y^2 + z^2)
    const rawSVM = Math.sqrt(x * x + y * y + z * z);

    // Initial sample bootstrap
    if (!this.isInitialized) {
      this.smoothedSVM = rawSVM;
      this.previousSmoothedSVM = rawSVM;
      this.previousSlope = 0;
      this.isInitialized = true;
      return false;
    }

    // 2. Exponential Moving Average (EMA) smoothing: ALPHA = 0.25
    const currentSmoothed = this.ALPHA * rawSVM + (1 - this.ALPHA) * this.smoothedSVM;

    // 3. Slope Transition Peak Detection
    const currentSlope = currentSmoothed - this.smoothedSVM;
    let stepDetected = false;

    // Peak condition: slope transitions from positive (rising) to non-positive (falling/crest)
    // The previous smoothed sample (this.smoothedSVM) was the crest/peak of the acceleration curve
    if (this.previousSlope > 0 && currentSlope <= 0) {
      const peakMagnitude = this.smoothedSVM;

      // 4. Acceleration Thresholding (>= 1.22 G)
      if (peakMagnitude >= this.MIN_THRESHOLD_G) {
        // 5. Physiological Refractory Window Gating (240 ms to 1200 ms)
        const interval = timestamp - this.lastStepTimestamp;
        const isFirstStep = this.lastStepTimestamp === 0;
        const isRhythmicGait = interval >= this.MIN_REFRACTORY_MS && interval <= this.MAX_REFRACTORY_MS;
        const isNewStreak = interval > this.MAX_REFRACTORY_MS;

        if (isFirstStep || isRhythmicGait || isNewStreak) {
          this.steps++;
          this.lastStepTimestamp = timestamp;
          this.recentStepTimestamps.push(timestamp);
          this.pruneCadenceWindow(timestamp);
          stepDetected = true;
          this.notifySubscribers();
        }
      }
    }

    // Update state for next sample
    this.previousSlope = currentSlope;
    this.previousSmoothedSVM = this.smoothedSVM;
    this.smoothedSVM = currentSmoothed;

    // Inactivity timeout: if no step for > 3.0 seconds, cadence decays to 0
    if (timestamp - this.lastStepTimestamp > 3000 && this.cadence > 0) {
      this.cadence = 0;
      this.notifySubscribers();
    }

    return stepDetected;
  }

  /**
   * Returns cumulative step count.
   */
  public getSteps(): number {
    return this.steps;
  }

  /**
   * Set or reconcile cumulative step count from hardware or database.
   */
  public setSteps(count: number): void {
    const sanitized = Math.max(0, Math.round(count));
    if (this.steps !== sanitized) {
      this.steps = sanitized;
      this.lastStepTimestamp = Date.now();
      this.notifySubscribers();
    }
  }

  /**
   * Returns current locomotion cadence in steps per minute (SPM).
   */
  public getCadence(): number {
    return this.cadence;
  }

  /**
   * Returns the timestamp of the last detected step.
   */
  public getLastStepTimestamp(): number {
    return this.lastStepTimestamp;
  }

  /**
   * Reset detector state for calibration or user switch.
   */
  public reset(): void {
    this.steps = 0;
    this.cadence = 0;
    this.smoothedSVM = 0;
    this.previousSmoothedSVM = 0;
    this.previousSlope = 0;
    this.isInitialized = false;
    this.lastStepTimestamp = 0;
    this.recentStepTimestamps = [];
    this.notifySubscribers();
  }

  /**
   * Prune rolling 10-second window to derive instantaneous gait cadence (SPM).
   */
  private pruneCadenceWindow(now: number): void {
    const windowStart = now - 10000;
    this.recentStepTimestamps = this.recentStepTimestamps.filter((t) => t >= windowStart);

    if (this.recentStepTimestamps.length >= 2) {
      const first = this.recentStepTimestamps[0];
      const last = this.recentStepTimestamps[this.recentStepTimestamps.length - 1];
      const elapsedSec = (last - first) / 1000;
      if (elapsedSec >= 0.4) {
        // True physiological cadence based on elapsed stride durations
        const stepIntervals = this.recentStepTimestamps.length - 1;
        this.cadence = Math.round((stepIntervals / elapsedSec) * 60);
      }
    } else if (now - this.lastStepTimestamp > 3000) {
      this.cadence = 0;
    }
  }

  /**
   * Subscribe to step detection events.
   */
  public subscribe(callback: (steps: number, cadence: number) => void): () => void {
    this.subscribers.add(callback);
    callback(this.steps, this.cadence);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((cb) => {
      try {
        cb(this.steps, this.cadence);
      } catch (err) {
        console.error('[StepDetector] Subscriber error:', err);
      }
    });
  }
}

export const stepDetector = new StepDetector();
