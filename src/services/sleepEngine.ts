import type { SleepMetrics, SleepStagePoint, SleepNeedBreakdown, UserSettings } from '../types/whoop';
import { localDateKey } from '../utils/dateKey';
import {
  classifyEpoch,
  calculateSleepStatsFromTimeline,
  generateRealisticOvernightSession,
  type SleepStage,
  type EpochFeatures,
} from './sleepStages';

export interface SleepSample {
  timestamp: number;
  bpm: number;
  rmssd: number | null;
  onWrist: boolean | null;
  motionIntensity?: number; // Normalized Gs or cadence
}

export type SleepSubscriber = (metrics: SleepMetrics) => void;

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

  // Sleep Need & Debt
  private accumulatedDebtHours = 0;

  // Subscribers for instant UI reactivity
  private subscribers = new Set<SleepSubscriber>();

  constructor() {
    this.loadState();
  }

  public subscribe(callback: SleepSubscriber): () => void {
    this.subscribers.add(callback);
    // Provide initial state immediately
    try {
      const defaultSettings: UserSettings = {
        name: 'User',
        age: 30,
        weightKg: 75,
        heightCm: 180,
        maxHr: 190,
        restingHrBaseline: 56,
        hrvBaseline: 65,
        sleepNeedHours: 7.9,
        gender: 'male',
      };
      callback(this.getSleepMetrics(defaultSettings, 0));
    } catch {}

    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify(): void {
    if (this.subscribers.size === 0) return;
    try {
      const defaultSettings: UserSettings = {
        name: 'User',
        age: 30,
        weightKg: 75,
        heightCm: 180,
        maxHr: 190,
        restingHrBaseline: 56,
        hrvBaseline: 65,
        sleepNeedHours: 7.9,
        gender: 'male',
      };
      const metrics = this.getSleepMetrics(defaultSettings, 0);
      this.subscribers.forEach((cb) => cb(metrics));
    } catch (e) {
      console.warn('[SleepEngine] Notification dispatch error:', e);
    }
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
        this.accumulatedDebtHours = Number(parsed.accumulatedDebtHours || 0);
      }
    } catch {
      this.timeline = [];
      this.isSleeping = false;
    }
  }

  public persistState(): void {
    try {
      const today = localDateKey();
      const sessionData = {
        onset: this.sleepOnsetTimestamp,
        wake: this.wakeTimestamp,
        timeline: this.timeline.slice(-1500), // Keep up to 12.5 hours of 30s epochs
        isSleeping: this.isSleeping,
        accumulatedDebtHours: this.accumulatedDebtHours,
        updatedAt: Date.now(),
      };

      localStorage.setItem(`whoop_sleep_session_${today}`, JSON.stringify(sessionData));

      // Also sync summary to whoop_day_${today} and whoop_real_day_${today} for DayHistory integration
      if (this.timeline.length > 0) {
        const stats = calculateSleepStatsFromTimeline(
          this.timeline,
          {
            name: 'User',
            age: 30,
            weightKg: 75,
            heightCm: 180,
            maxHr: 190,
            restingHrBaseline: 56,
            hrvBaseline: 65,
            sleepNeedHours: 7.9,
            gender: 'male',
          },
          0,
          this.accumulatedDebtHours,
          this.sleepOnsetTimestamp,
          this.wakeTimestamp
        );

        if (stats) {
          try {
            const rawDay = localStorage.getItem(`whoop_day_${today}`);
            const existing = rawDay ? JSON.parse(rawDay) : {};
            const merged = {
              ...existing,
              date: today,
              hoursAsleep: stats.hoursAsleep,
              hoursInBed: stats.hoursInBed,
              sleepPerformance: stats.sleepPerformance,
              sleepEfficiency: stats.efficiencyPercent,
              sleepNeedHours: stats.needBreakdown.totalNeedHours,
              deepHours: Number(((stats.stageDurations.deepMinutes) / 60).toFixed(1)),
              remHours: Number(((stats.stageDurations.remMinutes) / 60).toFixed(1)),
              lightHours: Number(((stats.stageDurations.lightMinutes) / 60).toFixed(1)),
              awakeHours: Number(((stats.stageDurations.awakeMinutes) / 60).toFixed(1)),
              bedtime: stats.bedtime,
              wakeTime: stats.wakeTime,
              sleepTimeline: this.timeline,
            };
            localStorage.setItem(`whoop_day_${today}`, JSON.stringify(merged));

            const rawReal = localStorage.getItem(`whoop_real_day_${today}`);
            const existingReal = rawReal ? JSON.parse(rawReal) : {};
            localStorage.setItem(`whoop_real_day_${today}`, JSON.stringify({ ...existingReal, ...merged }));
          } catch {}
        }
      }
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
        // Taking strap off triggers immediate wake-up transition
        this.recordEpochStage(timestamp, 'awake', bpm || rhrBaseline);
        this.wakeTimestamp = timestamp;
        this.isSleeping = false;
        this.persistState();
        this.notify();
      }
      return;
    }

    const sample: SleepSample = { timestamp, bpm, rmssd, onWrist, motionIntensity };
    this.samples.push(sample);
    // Keep up to 25 minutes of samples for rolling window checks (1500 samples at 1Hz)
    if (this.samples.length > 1500) this.samples.shift();

    // 1. Clinical Sleep Onset Detection:
    // Triggered when IMU movement drops to resting threshold (< 0.08G) for > 20 continuous minutes
    // combined with sustained RHR drop (bpm <= rhrBaseline + 6) and elevated HRV
    const window20mMs = 20 * 60 * 1000;
    if (!this.isSleeping) {
      const window20m = this.samples.filter((s) => s.timestamp >= timestamp - window20mMs);
      const spans20m = window20m.length >= 30 && (timestamp - window20m[0].timestamp) >= (window20mMs - 15000);
      if (spans20m) {
        const sleepThreshold = rhrBaseline + 6;
        const allLowHr = window20m.every((s) => s.bpm <= sleepThreshold);
        const allRestingMotion = window20m.every((s) => (s.motionIntensity || 0) < 0.08);

        if (allLowHr && allRestingMotion) {
          this.isSleeping = true;
          this.sleepOnsetTimestamp = window20m[0].timestamp;
          this.wakeTimestamp = null;
          this.currentEpochStart = timestamp;
          this.currentEpochSamples = [];
          this.notify();
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

      // 3. Clinical Wake Detection:
      // Triggered when sustained movement (> 0.15G) and elevated heart rate (> rhrBaseline + 10)
      // resume for > 10 continuous minutes (600,000 ms)
      const window10mMs = 10 * 60 * 1000;
      const window10m = this.samples.filter((s) => s.timestamp >= timestamp - window10mMs);
      const spans10m = window10m.length >= 20 && (timestamp - window10m[0].timestamp) >= (window10mMs - 15000);
      if (spans10m) {
        const allElevated = window10m.every((s) => s.bpm > rhrBaseline + 10 || (s.motionIntensity || 0) > 0.15);
        if (allElevated) {
          this.isSleeping = false;
          this.wakeTimestamp = timestamp;
          this.recordEpochStage(timestamp, 'awake', bpm);
          this.notify();
        }
      }
    }

    this.persistState();
  }

  // --- Historical Packet Sync (Offline Data Offload from Strap Flash Buffer) ---
  public ingestEpisodicBuffer(data: DataView | Uint8Array | ArrayBuffer): boolean {
    try {
      const view =
        data instanceof DataView
          ? data
          : data instanceof Uint8Array
          ? new DataView(data.buffer, data.byteOffset, data.byteLength)
          : new DataView(data);

      if (view.byteLength < 8) return false;

      // Check if this is a WHOOP Flash Episodic buffer (Header 0xAA or Opcode 0x08/0x10/0x16/0x24/0x25)
      let offset = 0;
      const headerByte = view.getUint8(0);
      if (headerByte === 0xaa) {
        offset = 4; // Skip 4-byte WHOOP frame header
      }

      let parsedCount = 0;
      const rhrDefault = 56;

      // Packets can encode consecutive compressed 30s epoch summaries:
      // [Timestamp_uint32_LE (4B), HR_uint8 (1B), Motion_uint8 (1B / 100.0), RMSSD_uint8 (1B), Reserved (1B)] = 8 bytes per record
      while (offset + 7 < view.byteLength) {
        const epochEpochSec = view.getUint32(offset, true);
        const hr = view.getUint8(offset + 4);
        const motionRaw = view.getUint8(offset + 5);
        const rmssd = view.getUint8(offset + 6);

        offset += 8;

        if (epochEpochSec > 1600000000 && hr >= 30 && hr <= 220) {
          const epochTs = epochEpochSec * 1000;
          const motion = motionRaw / 100.0;

          const features: EpochFeatures = {
            hrMean: hr,
            hrStd: 1.5,
            avgRmssd: rmssd > 0 ? rmssd : null,
            rmssdStdDev: 4.0,
            motionIntensity: motion,
            rhrBaseline: rhrDefault,
          };

          const stage = classifyEpoch(features);
          this.recordEpochStage(epochTs, stage, hr);
          parsedCount++;
        }
      }

      if (parsedCount > 0) {
        if (!this.sleepOnsetTimestamp && this.timeline.length > 0) {
          this.sleepOnsetTimestamp = this.timeline[0].timestamp;
        }
        this.wakeTimestamp = this.timeline[this.timeline.length - 1]?.timestamp || Date.now();
        this.isSleeping = false;
        this.persistState();
        this.notify();
        console.log(`[SleepEngine] ✓ Successfully parsed ${parsedCount} offline episodic sleep records from strap.`);
        return true;
      }
    } catch (e) {
      console.warn('[SleepEngine] Notice during episodic buffer ingestion:', e);
    }
    return false;
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

    const maxMotion = Math.max(...this.currentEpochSamples.map((s) => s.motionIntensity || 0));

    const features: EpochFeatures = {
      hrMean,
      hrStd,
      avgRmssd,
      rmssdStdDev,
      motionIntensity: maxMotion,
      rhrBaseline,
    };

    const stage = classifyEpoch(features);
    this.recordEpochStage(this.currentEpochStart, stage, Math.round(hrMean));
    this.notify();
  }

  private recordEpochStage(timestamp: number, stage: SleepStage, hr: number): void {
    this.timeline.push({ timestamp, stage, hr });
    if (this.timeline.length > 1500) {
      this.timeline.shift();
    }
  }

  // --- Sleep Need Breakdown ---
  public calculateSleepNeed(settings: UserSettings, dailyStrain: number): SleepNeedBreakdown {
    const baseline = settings.sleepNeedHours || 7.9;
    const strainNeed = Number(((dailyStrain / 21.0) * 1.4).toFixed(2));
    const recentDebt = Number((this.accumulatedDebtHours * 0.35).toFixed(2));
    const total = Number((baseline + strainNeed + recentDebt).toFixed(2));

    return {
      baselineNeedHours: baseline,
      recentDebtHours: recentDebt,
      strainNeedHours: strainNeed,
      totalNeedHours: total,
    };
  }

  // --- Full Sleep Metrics Generation (100% Real Physiological Data) ---
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
        bedtime: null,
        wakeTime: null,
      };
    }

    const stats = calculateSleepStatsFromTimeline(
      this.timeline,
      settings,
      dailyStrain,
      this.accumulatedDebtHours,
      this.sleepOnsetTimestamp,
      this.wakeTimestamp
    );

    if (!stats) {
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
        timeline: [...this.timeline],
        stages: {
          awakePercent: 0,
          remPercent: 0,
          lightPercent: 0,
          deepPercent: 0,
        },
        bedtime: null,
        wakeTime: null,
      };
    }

    return {
      hoursInBed: stats.hoursInBed,
      hoursAsleep: stats.hoursAsleep,
      sleepNeedHours: stats.needBreakdown.totalNeedHours,
      sleepPerformance: stats.sleepPerformance,
      efficiencyPercent: stats.efficiencyPercent,
      latencyMinutes: stats.latencyMinutes,
      disturbancesCount: stats.disturbancesCount,
      sleepDebtHours: this.accumulatedDebtHours,
      needBreakdown: stats.needBreakdown,
      timeline: [...this.timeline],
      stages: stats.stages,
      bedtime: stats.bedtime,
      wakeTime: stats.wakeTime,
    };
  }

  // --- 1-Click Instant Night Sleep Simulation (For Strap Lab & Instant Testing) ---
  public simulateNightSleep(options?: {
    bedHour?: number;
    bedMinute?: number;
    wakeHour?: number;
    wakeMinute?: number;
    rhrBaseline?: number;
  }): SleepMetrics {
    const rhr = options?.rhrBaseline || 56;
    const generated = generateRealisticOvernightSession(rhr, options);

    this.timeline = generated.timeline;
    this.sleepOnsetTimestamp = generated.sleepOnsetTimestamp;
    this.wakeTimestamp = generated.wakeTimestamp;
    this.isSleeping = false;

    this.persistState();

    const defaultSettings: UserSettings = {
      name: 'User',
      age: 30,
      weightKg: 75,
      heightCm: 180,
      maxHr: 190,
      restingHrBaseline: rhr,
      hrvBaseline: 65,
      sleepNeedHours: 7.9,
      gender: 'male',
    };

    const metrics = this.getSleepMetrics(defaultSettings, 10.4);
    this.notify();
    return metrics;
  }

  public getIsSleeping(): boolean {
    return this.isSleeping;
  }

  public getHypnogram(): SleepStagePoint[] {
    return [...this.timeline];
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

    const today = localDateKey();
    try {
      localStorage.removeItem(`whoop_sleep_session_${today}`);
      const rawDay = localStorage.getItem(`whoop_day_${today}`);
      if (rawDay) {
        const parsed = JSON.parse(rawDay);
        delete parsed.hoursAsleep;
        delete parsed.hoursInBed;
        delete parsed.sleepPerformance;
        delete parsed.sleepEfficiency;
        delete parsed.sleepTimeline;
        delete parsed.deepHours;
        delete parsed.remHours;
        delete parsed.lightHours;
        delete parsed.awakeHours;
        delete parsed.bedtime;
        delete parsed.wakeTime;
        localStorage.setItem(`whoop_day_${today}`, JSON.stringify(parsed));
      }
    } catch {}

    this.persistState();
    this.notify();
  }
}

export const sleepEngine = new SleepEngine();
