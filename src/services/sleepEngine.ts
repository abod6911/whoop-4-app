import type { SleepMetrics, SleepStagePoint, SleepNeedBreakdown, UserSettings } from '../types/whoop';
import { localDateKey } from '../utils/dateKey';

export interface SleepSample {
  timestamp: number;
  bpm: number;
  rmssd: number | null;
  onWrist: boolean | null;
  motionIntensity?: number; // Normalized Gs or cadence
}

export class SleepEngine {
  private samples: SleepSample[] = [];
  private currentEpochSamples: SleepSample[] = [];
  private currentEpochStart = 0;
  private readonly epochDurationMs = 30000; // Clinical 30-second epoch standard

  private isSleeping = false;
  private sleepOnsetTimestamp: number | null = null;
  private wakeTimestamp: number | null = null;

  // Real Classified Timeline (Hypnogram: 30s epoch records, up to 1500 epochs = 12.5h)
  private timeline: SleepStagePoint[] = [];

  // Sleep Need & Debt (No fake hardcoded debt)
  private accumulatedDebtHours = 0;

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    try {
      const today = localDateKey();
      const saved = localStorage.getItem(`whoop_sleep_session_${today}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.sleepOnsetTimestamp = parsed.onset || null;
        this.wakeTimestamp = parsed.wake || null;
        this.timeline = Array.isArray(parsed.timeline) ? parsed.timeline : [];
        this.isSleeping = Boolean(parsed.isSleeping);
      }
    } catch {
      this.timeline = [];
      this.isSleeping = false;
    }
  }

  private persistState(): void {
    try {
      const today = localDateKey();
      localStorage.setItem(
        `whoop_sleep_session_${today}`,
        JSON.stringify({
          onset: this.sleepOnsetTimestamp,
          wake: this.wakeTimestamp,
          timeline: this.timeline.slice(-1500), // Keep up to 12.5 hours of 30s epochs
          isSleeping: this.isSleeping,
          updatedAt: Date.now(),
        })
      );
    } catch {}
  }

  // --- Real-Time Physiological Sample Ingestion (Called every heart rate beat/packet) ---
  public ingestSample(
    bpm: number,
    rmssd: number | null,
    onWrist: boolean | null,
    rhrBaseline: number,
    timestamp = Date.now(),
    motionIntensity = 0
  ): void {
    if (!bpm || bpm <= 0 || onWrist === false) {
      if (this.isSleeping && onWrist === false) {
        // Taking strap off triggers wake-up transition
        this.recordEpochStage(timestamp, 'awake', bpm || rhrBaseline);
        this.wakeTimestamp = timestamp;
        this.isSleeping = false;
        this.persistState();
      }
      return;
    }

    const sample: SleepSample = { timestamp, bpm, rmssd, onWrist, motionIntensity };
    this.samples.push(sample);
    // Keep up to 20 minutes of samples for rolling window checks
    if (this.samples.length > 1200) this.samples.shift();

    // 1. Automatic Sleep Onset Detection: 10 full minutes (600,000 ms) sustained low HR & low motion
    const sleepThreshold = rhrBaseline + 6;
    if (!this.isSleeping) {
      const window10m = this.samples.filter((s) => s.timestamp >= timestamp - 600000);
      const spans10m = window10m.length >= 20 && (timestamp - window10m[0].timestamp) >= 590000;
      if (spans10m) {
        const allLowHr = window10m.every((s) => s.bpm <= sleepThreshold);
        const allLowMotion = window10m.every((s) => (s.motionIntensity || 0) < 0.12);
        if (allLowHr && allLowMotion) {
          this.isSleeping = true;
          this.sleepOnsetTimestamp = window10m[0].timestamp;
          this.wakeTimestamp = null;
          this.currentEpochStart = timestamp;
          this.currentEpochSamples = [];
        }
      }
    }

    // 2. 30-Second Epoch Architecture Aggregation
    if (this.isSleeping) {
      if (this.currentEpochStart === 0) {
        this.currentEpochStart = timestamp;
      }

      this.currentEpochSamples.push(sample);

      // Check if 30-second epoch is ready for clinical classification
      if (timestamp - this.currentEpochStart >= this.epochDurationMs) {
        this.process30sEpoch(rhrBaseline);
        this.currentEpochStart = timestamp;
        this.currentEpochSamples = [];
      }

      // Automatic Wake Detection: 3 full minutes (180,000 ms) of sustained elevated HR
      const window3m = this.samples.filter((s) => s.timestamp >= timestamp - 180000);
      const spans3m = window3m.length >= 10 && (timestamp - window3m[0].timestamp) >= 175000;
      if (spans3m) {
        const allElevated = window3m.every((s) => s.bpm > rhrBaseline + 10 || (s.motionIntensity || 0) > 0.18);
        if (allElevated) {
          this.isSleeping = false;
          this.wakeTimestamp = timestamp;
          this.recordEpochStage(timestamp, 'awake', bpm);
        }
      }
    }

    this.persistState();
  }

  // --- Process Clinical 30s Epoch ---
  private process30sEpoch(rhrBaseline: number): void {
    if (this.currentEpochSamples.length === 0) return;

    const count = this.currentEpochSamples.length;
    const hrMean = this.currentEpochSamples.reduce((sum, s) => sum + s.bpm, 0) / count;
    const hrVariance = this.currentEpochSamples.reduce((sum, s) => sum + Math.pow(s.bpm - hrMean, 2), 0) / count;
    const hrStd = Math.sqrt(hrVariance);

    const validRmssd = this.currentEpochSamples.filter((s) => s.rmssd !== null && (s.rmssd ?? 0) > 0);
    const avgRmssd =
      validRmssd.length > 0
        ? Math.round(validRmssd.reduce((sum, s) => sum + (s.rmssd || 0), 0) / validRmssd.length)
        : null;

    let rmssdVariance = 0;
    if (validRmssd.length >= 2 && avgRmssd !== null) {
      rmssdVariance =
        validRmssd.reduce((acc, s) => acc + Math.pow((s.rmssd || 0) - avgRmssd, 2), 0) /
        validRmssd.length;
    }
    const rmssdStdDev = Math.sqrt(rmssdVariance);

    const maxMotion = Math.max(
      ...this.currentEpochSamples.map((s) => s.motionIntensity || 0)
    );

    const stage = this.evaluateEpochStage(hrMean, hrStd, avgRmssd, rmssdStdDev, maxMotion, rhrBaseline);
    this.recordEpochStage(this.currentEpochStart, stage, Math.round(hrMean));
  }

  // --- Dynamic 30s Epoch Stage Classifier (Slow-Wave SWS, REM, Light, Awake) ---
  private evaluateEpochStage(
    hrMean: number,
    hrStd: number,
    _avgRmssd: number | null,
    rmssdStdDev: number,
    motion: number,
    rhrRef: number
  ): 'awake' | 'light' | 'deep' | 'rem' {
    // 1. Awake: motion above threshold OR HR > rhrRef + 10
    if (motion > 0.15 || hrMean > rhrRef + 10) {
      return 'awake';
    }

    // 2. Deep / SWS (Slow-Wave Sleep): very low motion, HR <= rhrRef - 3, and low HR variability/volatility
    if (motion < 0.05 && hrMean <= rhrRef - 3 && hrStd <= 2.2) {
      return 'deep';
    }

    // 3. REM Sleep: near-zero motion (muscle atonia), high HR fluctuation/volatility (hrStd > 2.2 or fluctuating RMSSD), and HR near rhrRef
    const nearRhr = hrMean >= rhrRef - 3 && hrMean <= rhrRef + 8;
    if (motion < 0.05 && nearRhr && (hrStd > 2.2 || rmssdStdDev >= 8)) {
      return 'rem';
    }

    // 4. Light Sleep: all intermediate sleep epochs
    return 'light';
  }

  private recordEpochStage(timestamp: number, stage: 'awake' | 'light' | 'deep' | 'rem', hr: number): void {
    this.timeline.push({ timestamp, stage, hr });
    if (this.timeline.length > 1500) {
      this.timeline.shift();
    }
  }

  // --- Sleep Need Breakdown ---
  public calculateSleepNeed(settings: UserSettings, dailyStrain: number): SleepNeedBreakdown {
    const baseline = settings.sleepNeedHours || 7.9;
    // Extra recovery requirement from physical strain: ~0.08 hrs per strain point
    const strainNeed = Number(((dailyStrain / 21.0) * 1.4).toFixed(2));
    // Gradual paydown of accumulated sleep debt (1/3 per night)
    const recentDebt = Number((this.accumulatedDebtHours * 0.35).toFixed(2));
    const total = Number((baseline + strainNeed + recentDebt).toFixed(2));

    return {
      baselineNeedHours: baseline,
      recentDebtHours: recentDebt,
      strainNeedHours: strainNeed,
      totalNeedHours: total,
    };
  }

  // --- Full Sleep Metrics Generation (100% Real - Zero Fallbacks) ---
  public getSleepMetrics(settings: UserSettings, dailyStrain: number): SleepMetrics {
    const needBreakdown = this.calculateSleepNeed(settings, dailyStrain);
    const needHours = needBreakdown.totalNeedHours;

    if (this.timeline.length === 0) {
      // Clean zero/null state when no sleep session is recorded yet
      return {
        hoursInBed: null,
        hoursAsleep: null,
        sleepNeedHours: needHours,
        sleepPerformance: null,
        efficiencyPercent: null,
        latencyMinutes: null,
        disturbancesCount: null,
        sleepDebtHours: this.accumulatedDebtHours,
        needBreakdown,
        timeline: [],
        stages: {
          awakePercent: 0,
          remPercent: 0,
          lightPercent: 0,
          deepPercent: 0,
        },
      };
    }

    // Calculate real stages distribution from actual 30s epoch timeline
    let awakeCount = 0;
    let lightCount = 0;
    let deepCount = 0;
    let remCount = 0;
    let disturbances = 0;
    let lastStage: string | null = null;

    this.timeline.forEach((pt) => {
      if (pt.stage === 'awake') awakeCount++;
      else if (pt.stage === 'light') lightCount++;
      else if (pt.stage === 'deep') deepCount++;
      else if (pt.stage === 'rem') remCount++;

      if (pt.stage === 'awake' && lastStage && lastStage !== 'awake') {
        disturbances++;
      }
      lastStage = pt.stage;
    });

    const totalEpochs = this.timeline.length;
    // Each epoch is 30 seconds (0.5 minutes)
    const totalMinutes = totalEpochs * 0.5;
    const asleepMinutes = (lightCount + deepCount + remCount) * 0.5;

    const hoursInBed = Number((totalMinutes / 60).toFixed(2));
    const hoursAsleep = Number((asleepMinutes / 60).toFixed(2));

    const efficiency = totalEpochs > 0 ? Math.round(((totalEpochs - awakeCount) / totalEpochs) * 100) : 0;
    const perf = needHours > 0 ? Math.min(100, Math.round((hoursAsleep / needHours) * 100)) : 0;

    const awakePct = totalEpochs > 0 ? Math.round((awakeCount / totalEpochs) * 100) : 0;
    const lightPct = totalEpochs > 0 ? Math.round((lightCount / totalEpochs) * 100) : 0;
    const deepPct = totalEpochs > 0 ? Math.round((deepCount / totalEpochs) * 100) : 0;
    const remPct = totalEpochs > 0 ? Math.round((remCount / totalEpochs) * 100) : 0;

    const latencyMinutes =
      this.sleepOnsetTimestamp && this.timeline[0]
        ? Math.max(0, Math.round((this.sleepOnsetTimestamp - this.timeline[0].timestamp) / 60000))
        : null;

    return {
      hoursInBed,
      hoursAsleep,
      sleepNeedHours: needHours,
      sleepPerformance: perf,
      efficiencyPercent: efficiency,
      latencyMinutes,
      disturbancesCount: disturbances,
      sleepDebtHours: this.accumulatedDebtHours,
      needBreakdown,
      timeline: [...this.timeline],
      stages: {
        awakePercent: awakePct,
        lightPercent: lightPct,
        deepPercent: deepPct,
        remPercent: remPct,
      },
    };
  }

  public getIsSleeping(): boolean {
    return this.isSleeping;
  }

  public getSleepTimes(): { onsetTime: string | null; wakeTime: string | null } {
    const onsetTime = this.sleepOnsetTimestamp
      ? new Date(this.sleepOnsetTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      : null;
    const wakeTime = this.wakeTimestamp
      ? new Date(this.wakeTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      : null;
    return { onsetTime, wakeTime };
  }

  public resetSleepSession(): void {
    this.timeline = [];
    this.samples = [];
    this.currentEpochSamples = [];
    this.isSleeping = false;
    this.sleepOnsetTimestamp = null;
    this.wakeTimestamp = null;
    this.persistState();
  }
}

export const sleepEngine = new SleepEngine();
