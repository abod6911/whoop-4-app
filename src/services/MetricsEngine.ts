import type { LiveMetrics, HrZoneInfo, UserSettings, SessionRecord } from '../types/whoop';
import { storageService } from './StorageService';

export class MetricsEngine {
  private userSettings: UserSettings;
  private rrBuffer: number[] = []; // Milliseconds
  private maxBufferSize = 150; // Keep recent RR intervals
  private hrHistory: Array<{ timestamp: number; bpm: number }> = [];

  // Zone duration counters (in seconds)
  private zoneSeconds: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  private totalActiveCalories = 0;
  private minHrObserved = 999;
  private maxHrObserved = 0;
  private hrSum = 0;
  private hrCount = 0;
  private dailyStrain = 0;
  private trimpAccumulator = 0;

  constructor(settings?: UserSettings) {
    this.userSettings = settings || storageService.getUserSettings();
    this.loadTodayState();
  }

  public updateSettings(settings: UserSettings): void {
    this.userSettings = settings;
  }

  public getSettings(): UserSettings {
    return this.userSettings;
  }

  private loadTodayState(): void {
    const baselines = storageService.get7DayBaselines();
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBaseline = baselines.find((b) => b.date === todayStr);
    if (todayBaseline && todayBaseline.dayStrain > 0) {
      this.dailyStrain = todayBaseline.dayStrain;
      this.trimpAccumulator = this.strainToTrimp(this.dailyStrain);
    }
  }

  // --- Heart Rate Zones ---
  public getZones(): HrZoneInfo[] {
    const max = this.userSettings.maxHr;
    return [
      {
        zone: 1,
        name: 'Zone 1: Active Recovery',
        minBpm: Math.round(max * 0.5),
        maxBpm: Math.round(max * 0.6) - 1,
        color: '#3B82F6', // Blue
        intensity: '50% - 60% Max HR',
      },
      {
        zone: 2,
        name: 'Zone 2: Aerobic Base',
        minBpm: Math.round(max * 0.6),
        maxBpm: Math.round(max * 0.7) - 1,
        color: '#00E676', // Green
        intensity: '60% - 70% Max HR',
      },
      {
        zone: 3,
        name: 'Zone 3: Tempo / Aerobic',
        minBpm: Math.round(max * 0.7),
        maxBpm: Math.round(max * 0.8) - 1,
        color: '#00F0FF', // Cyan
        intensity: '70% - 80% Max HR',
      },
      {
        zone: 4,
        name: 'Zone 4: Threshold',
        minBpm: Math.round(max * 0.8),
        maxBpm: Math.round(max * 0.9) - 1,
        color: '#FFB300', // Amber
        intensity: '80% - 90% Max HR',
      },
      {
        zone: 5,
        name: 'Zone 5: Max Capacity',
        minBpm: Math.round(max * 0.9),
        maxBpm: max,
        color: '#FF3366', // Crimson
        intensity: '90% - 100% Max HR',
      },
    ];
  }

  public determineZone(bpm: number): 0 | 1 | 2 | 3 | 4 | 5 {
    const max = this.userSettings.maxHr;
    if (bpm < max * 0.5) return 0;
    if (bpm < max * 0.6) return 1;
    if (bpm < max * 0.7) return 2;
    if (bpm < max * 0.8) return 3;
    if (bpm < max * 0.9) return 4;
    return 5;
  }

  // --- RR Interval Processing & HRV Calculation ---
  public addRRIntervals(intervalsMs: number[]): void {
    intervalsMs.forEach((rr) => {
      if (rr >= 300 && rr <= 2000) {
        if (this.rrBuffer.length > 0) {
          const last = this.rrBuffer[this.rrBuffer.length - 1];
          const diffRatio = Math.abs(rr - last) / last;
          if (diffRatio > 0.45 && this.rrBuffer.length > 5) {
            return;
          }
        }
        this.rrBuffer.push(rr);
        if (this.rrBuffer.length > this.maxBufferSize) {
          this.rrBuffer.shift();
        }
      }
    });
  }

  public calculateRMSSD(): number {
    const n = this.rrBuffer.length;
    if (n < 2) return this.userSettings.hrvBaseline;

    let sumDiffSq = 0;
    for (let i = 0; i < n - 1; i++) {
      const diff = this.rrBuffer[i + 1] - this.rrBuffer[i];
      sumDiffSq += diff * diff;
    }

    const rmssd = Math.sqrt(sumDiffSq / (n - 1));
    return Math.round(rmssd);
  }

  public calculateSDNN(): number {
    const n = this.rrBuffer.length;
    if (n < 2) return Math.round(this.userSettings.hrvBaseline * 1.1);

    const mean = this.rrBuffer.reduce((a, b) => a + b, 0) / n;
    const variance = this.rrBuffer.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
    return Math.round(Math.sqrt(variance));
  }

  public getMeanRR(): number {
    if (this.rrBuffer.length === 0) return 850;
    return Math.round(this.rrBuffer.reduce((a, b) => a + b, 0) / this.rrBuffer.length);
  }

  // --- Calories Burned (Keytel Equation) ---
  private calculateCaloriesPerSecond(bpm: number): number {
    if (bpm < this.userSettings.restingHrBaseline * 1.1) return 0.015;

    const { gender, weightKg, age } = this.userSettings;
    let calPerMin = 0;

    if (gender === 'male') {
      calPerMin = (-55.0969 + 0.6309 * bpm + 0.1988 * weightKg + 0.2017 * age) / 4.184;
    } else {
      calPerMin = (-20.4022 + 0.4472 * bpm - 0.1263 * weightKg + 0.074 * age) / 4.184;
    }

    const calPerSec = Math.max(0, calPerMin / 60);
    return calPerSec;
  }

  // --- Strain Engine (0.0 to 21.0 Logarithmic Scale) ---
  public calculateStrainFromTrimp(trimp: number): number {
    if (trimp <= 0) return 0;
    const tau = 70.0;
    const rawStrain = 21.0 * (1 - Math.exp(-trimp / tau));
    return Number(Math.min(21.0, Math.max(0, rawStrain)).toFixed(1));
  }

  private strainToTrimp(strain: number): number {
    if (strain <= 0) return 0;
    if (strain >= 21) return 500;
    const ratio = 1 - strain / 21.0;
    return -70.0 * Math.log(Math.max(0.001, ratio));
  }

  // --- Recovery Score Calculation (0% - 100%) ---
  public calculateRecovery(currentHrv: number, currentRhr: number): { score: number; category: 'green' | 'yellow' | 'red' } {
    const baselines = storageService.get7DayBaselines();

    let avgHrvBase = this.userSettings.hrvBaseline;
    let avgRhrBase = this.userSettings.restingHrBaseline;

    if (baselines.length > 0) {
      const hrvSum = baselines.reduce((acc, b) => acc + b.hrv, 0);
      const rhrSum = baselines.reduce((acc, b) => acc + b.rhr, 0);
      avgHrvBase = Math.round(hrvSum / baselines.length);
      avgRhrBase = Math.round(rhrSum / baselines.length);
    }

    const hrvDiffRatio = (currentHrv - avgHrvBase) / Math.max(20, avgHrvBase);
    const rhrDiffRatio = (avgRhrBase - currentRhr) / Math.max(30, avgRhrBase);

    const zComposite = hrvDiffRatio * 0.7 + rhrDiffRatio * 0.3;
    let score = Math.round(60 + zComposite * 80);
    score = Math.min(99, Math.max(1, score));

    let category: 'green' | 'yellow' | 'red' = 'yellow';
    if (score >= 67) {
      category = 'green';
    } else if (score <= 33) {
      category = 'red';
    }

    return { score, category };
  }

  // --- Core Real-time Tick Handler ---
  public ingestSample(bpm: number, rrIntervals: number[] = []): LiveMetrics {
    const now = Date.now();

    if (rrIntervals.length > 0) {
      this.addRRIntervals(rrIntervals);
    } else {
      const estRR = (60.0 / Math.max(30, bpm)) * 1000.0;
      this.addRRIntervals([estRR]);
    }

    this.hrCount += 1;
    this.hrSum += bpm;
    if (bpm < this.minHrObserved) this.minHrObserved = bpm;
    if (bpm > this.maxHrObserved) this.maxHrObserved = bpm;

    this.hrHistory.push({ timestamp: now, bpm });
    if (this.hrHistory.length > 300) this.hrHistory.shift();

    const zone = this.determineZone(bpm);
    if (zone >= 1) {
      this.zoneSeconds[zone] = (this.zoneSeconds[zone] || 0) + 1;
      const zoneWeights: Record<number, number> = { 1: 1.0, 2: 2.0, 3: 3.5, 4: 5.5, 5: 9.0 };
      const weight = zoneWeights[zone] || 1.0;
      this.trimpAccumulator += weight / 60.0;
      this.dailyStrain = this.calculateStrainFromTrimp(this.trimpAccumulator);
    }

    this.totalActiveCalories += this.calculateCaloriesPerSecond(bpm);

    const currentHrv = this.calculateRMSSD();
    const sdnn = this.calculateSDNN();
    const meanRR = this.getMeanRR();

    const estimatedRhr = Math.min(this.userSettings.restingHrBaseline, this.minHrObserved === 999 ? this.userSettings.restingHrBaseline : this.minHrObserved);
    const { score: recoveryScore, category: recoveryCategory } = this.calculateRecovery(currentHrv, estimatedRhr);

    if (this.hrCount % 30 === 0) {
      storageService.updateTodayBaseline(estimatedRhr, currentHrv, recoveryScore, this.dailyStrain);
    }

    const optimalTargetMin = Number((4.0 + (recoveryScore / 100) * 10.0).toFixed(1));
    const optimalTargetMax = Number(Math.min(20.5, optimalTargetMin + 3.2).toFixed(1));

    return {
      currentHr: bpm,
      currentHrv,
      sdnn,
      meanRR,
      minHr: this.minHrObserved === 999 ? bpm : this.minHrObserved,
      maxHr: this.maxHrObserved === 0 ? bpm : this.maxHrObserved,
      avgHr: Math.round(this.hrSum / this.hrCount),
      restingHr: estimatedRhr,
      dailyStrain: this.dailyStrain,
      recoveryScore,
      recoveryCategory,
      sleepPerformance: 98,
      activeCalories: Math.round(this.totalActiveCalories),
      currentZone: zone,
      zoneSeconds: { ...this.zoneSeconds },
      optimalStrainTarget: { min: optimalTargetMin, max: optimalTargetMax },
      timestamp: now,
    };
  }

  public evaluateWorkoutSession(
    startTime: number,
    endTime: number,
    samples: Array<{ timestamp: number; hr: number; hrv: number }>
  ): Omit<SessionRecord, 'id' | 'type' | 'title'> {
    const durationSec = Math.max(1, Math.round((endTime - startTime) / 1000));
    if (samples.length === 0) {
      return {
        startTime,
        endTime,
        durationSec,
        avgHr: 0,
        maxHr: 0,
        minHr: 0,
        strain: 0,
        calories: 0,
        avgHrv: this.userSettings.hrvBaseline,
        zoneDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        dataPoints: [],
      };
    }

    let minHr = 999;
    let maxHr = 0;
    let hrSum = 0;
    let hrvSum = 0;
    let totalCals = 0;
    let sessionTrimp = 0;
    const sessionZones: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const zoneWeights: Record<number, number> = { 1: 1.0, 2: 2.0, 3: 3.5, 4: 5.5, 5: 9.0 };

    samples.forEach((s) => {
      if (s.hr < minHr) minHr = s.hr;
      if (s.hr > maxHr) maxHr = s.hr;
      hrSum += s.hr;
      hrvSum += s.hrv;
      totalCals += this.calculateCaloriesPerSecond(s.hr);

      const z = this.determineZone(s.hr);
      if (z >= 1) {
        sessionZones[z] = (sessionZones[z] || 0) + 1;
        sessionTrimp += (zoneWeights[z] || 1) / 60.0;
      }
    });

    const sessionStrain = this.calculateStrainFromTrimp(sessionTrimp);

    return {
      startTime,
      endTime,
      durationSec,
      avgHr: Math.round(hrSum / samples.length),
      maxHr,
      minHr: minHr === 999 ? maxHr : minHr,
      strain: sessionStrain,
      calories: Math.round(totalCals),
      avgHrv: Math.round(hrvSum / samples.length),
      zoneDistribution: sessionZones,
      dataPoints: samples,
    };
  }

  public resetDayCounters(): void {
    this.zoneSeconds = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    this.totalActiveCalories = 0;
    this.dailyStrain = 0;
    this.trimpAccumulator = 0;
    this.hrCount = 0;
    this.hrSum = 0;
    this.minHrObserved = 999;
    this.maxHrObserved = 0;
    this.rrBuffer = [];
  }
}

export const metricsEngine = new MetricsEngine();
