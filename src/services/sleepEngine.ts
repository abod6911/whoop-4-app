import type { SleepMetrics, SleepStagePoint, SleepNeedBreakdown, UserSettings } from '../types/whoop';

export interface SleepSample {
  timestamp: number;
  bpm: number;
  rmssd: number | null;
  onWrist: boolean | null;
}

export class SleepEngine {
  private samples: SleepSample[] = [];
  private isSleeping = false;
  private sleepOnsetTimestamp: number | null = null;
  private wakeTimestamp: number | null = null;

  // Real Classified Timeline (Hypnogram)
  private timeline: SleepStagePoint[] = [];

  // Sleep Need & Debt
  private accumulatedDebtHours = 0.65; // ~39 mins rolling debt

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    try {
      const today = new Date().toISOString().split('T')[0];
      const saved = localStorage.getItem(`whoop_sleep_session_${today}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.sleepOnsetTimestamp = parsed.onset || null;
        this.wakeTimestamp = parsed.wake || null;
        this.timeline = parsed.timeline || [];
        this.isSleeping = parsed.isSleeping || false;
      }
    } catch {}
  }

  private persistState(): void {
    try {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(
        `whoop_sleep_session_${today}`,
        JSON.stringify({
          onset: this.sleepOnsetTimestamp,
          wake: this.wakeTimestamp,
          timeline: this.timeline.slice(-300),
          isSleeping: this.isSleeping,
        })
      );
    } catch {}
  }

  // --- Real-Time Physiological Sample Ingestion ---
  public ingestSample(bpm: number, rmssd: number | null, onWrist: boolean | null, rhrBaseline: number, timestamp = Date.now()): void {
    if (!bpm || bpm <= 0 || onWrist === false) {
      if (this.isSleeping && onWrist === false) {
        // Taking strap off triggers wake-up transition
        this.classifyStage(timestamp, 'awake', bpm);
        this.wakeTimestamp = timestamp;
        this.isSleeping = false;
        this.persistState();
      }
      return;
    }

    this.samples.push({ timestamp, bpm, rmssd, onWrist });
    if (this.samples.length > 500) this.samples.shift();

    // 1. Automatic Sleep Onset Detection
    // Condition: Heart rate sustained below RHR + 6 bpm for at least 10 samples
    const sleepThreshold = rhrBaseline + 6;
    if (!this.isSleeping && this.samples.length >= 10) {
      const recent = this.samples.slice(-10);
      const allLow = recent.every((s) => s.bpm <= sleepThreshold);
      if (allLow) {
        this.isSleeping = true;
        this.sleepOnsetTimestamp = recent[0].timestamp;
        this.wakeTimestamp = null;
      }
    }

    // 2. Real-Time Sleep Architecture Stage Classification
    if (this.isSleeping) {
      const stage = this.evaluateStage(bpm, rmssd, rhrBaseline);
      this.classifyStage(timestamp, stage, bpm);

      // Automatic Wake Detection (HR elevated above RHR + 18 for > 5 mins)
      if (this.samples.length >= 15) {
        const recentWakeCheck = this.samples.slice(-15);
        const allElevated = recentWakeCheck.every((s) => s.bpm > rhrBaseline + 18);
        if (allElevated) {
          this.isSleeping = false;
          this.wakeTimestamp = timestamp;
          this.classifyStage(timestamp, 'awake', bpm);
        }
      }
    }

    this.persistState();
  }

  // --- Dynamic Stage Classifier ---
  private evaluateStage(bpm: number, rmssd: number | null, rhrBaseline: number): 'awake' | 'light' | 'deep' | 'rem' {
    const diffFromRhr = bpm - rhrBaseline;

    // A. Awake: Spikes in HR (> 12 bpm above RHR)
    if (diffFromRhr > 12) {
      return 'awake';
    }

    // B. Deep / SWS (Slow-Wave Sleep): Lowest HR (at or below RHR) + Steady autonomic tone
    if (diffFromRhr <= 2 && (rmssd === null || rmssd < 75)) {
      return 'deep';
    }

    // C. REM Sleep: Fluctuating autonomic tone with high HRV variability
    if (rmssd !== null && rmssd >= 65 && diffFromRhr >= 3 && diffFromRhr <= 10) {
      return 'rem';
    }

    // D. Light Sleep: Steady intermediate baseline
    return 'light';
  }

  private classifyStage(timestamp: number, stage: 'awake' | 'light' | 'deep' | 'rem', hr: number): void {
    // Group timeline points into 1-minute intervals to avoid excessive resolution
    const lastPoint = this.timeline[this.timeline.length - 1];
    if (lastPoint && timestamp - lastPoint.timestamp < 45000) {
      lastPoint.stage = stage;
      lastPoint.hr = hr;
    } else {
      this.timeline.push({ timestamp, stage, hr });
      if (this.timeline.length > 400) this.timeline.shift();
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

  // --- Full Sleep Metrics Generation ---
  public getSleepMetrics(settings: UserSettings, dailyStrain: number): SleepMetrics {
    const needBreakdown = this.calculateSleepNeed(settings, dailyStrain);
    const needHours = needBreakdown.totalNeedHours;

    if (this.timeline.length === 0) {
      // Default baseline architecture when awaiting night session
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
          awakePercent: 8,
          remPercent: 24,
          lightPercent: 46,
          deepPercent: 22,
        },
      };
    }

    // Calculate real stages distribution from timeline
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

    const totalMinutes = this.timeline.length;
    const awakeMin = awakeCount;
    const asleepMin = lightCount + deepCount + remCount;
    const hoursInBed = Number((totalMinutes / 60).toFixed(2));
    const hoursAsleep = Number((asleepMin / 60).toFixed(2));

    const efficiency = totalMinutes > 0 ? Math.round((asleepMin / totalMinutes) * 100) : 0;
    const perf = needHours > 0 ? Math.min(100, Math.round((hoursAsleep / needHours) * 100)) : 0;

    const awakePct = totalMinutes > 0 ? Math.round((awakeCount / totalMinutes) * 100) : 5;
    const lightPct = totalMinutes > 0 ? Math.round((lightCount / totalMinutes) * 100) : 48;
    const deepPct = totalMinutes > 0 ? Math.round((deepCount / totalMinutes) * 100) : 23;
    const remPct = totalMinutes > 0 ? Math.round((remCount / totalMinutes) * 100) : 24;

    return {
      hoursInBed,
      hoursAsleep,
      sleepNeedHours: needHours,
      sleepPerformance: perf,
      efficiencyPercent: efficiency,
      latencyMinutes: 12,
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
}

export const sleepEngine = new SleepEngine();
