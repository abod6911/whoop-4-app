import type {
  LiveMetrics,
  HrZoneInfo,
  UserSettings,
  HeartRateMeasurement,
  StressPoint,
  PoincarePoint,
  SessionRecord,
} from '../types/whoop';
import { storageService } from '../services/StorageService';
import { notificationEngine } from '../services/notificationEngine';
import { pedometerEngine } from '../services/pedometerEngine';
import { sleepEngine } from '../services/sleepEngine';
import { whoopDb } from '../services/whoopDatabase';

export class BiometricEngine {
  private userSettings: UserSettings;

  // Real RR-interval rolling buffers
  private rrBuffer: number[] = []; // Clean valid RR intervals (ms)
  private maxBufferSize = 300;
  private lastRR: number | null = null;
  private poincarePoints: PoincarePoint[] = [];

  // RSA Respiratory Rate buffer ({ timestamp, rr })
  private rsaBuffer: Array<{ timestamp: number; rr: number }> = [];

  // Rolling 5-minute window for true Resting Heart Rate (RHR)
  private rolling5MinSamples: Array<{ timestamp: number; bpm: number }> = [];
  private realRhrObserved: number | null = null;

  // Overall HR stats
  private minHrObserved: number | null = null;
  private maxHrObserved: number | null = null;
  private hrSum = 0;
  private hrCount = 0;

  // Real Accumulators (Day Strain & Calories)
  private dailyStrain = 0;
  private trimpAccumulator = 0;
  private activeCalories = 0;
  private zoneSeconds: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  // Health Monitor: Skin Temperature & Blood Oxygen (SpO2)
  private skinTempCelsius: number | null = null;
  private skinTempDelta: number | null = null;
  private spO2: number | null = null;
  private spO2Readings: number[] = [];
  private spO2DipsCount = 0;

  // Real Stress Monitoring
  private stressPoints: StressPoint[] = [];
  private lastStressTick = 0;
  private currentStressScore: number | null = null;

  // State
  private lastBpm: number | null = null;
  private lastWristStatus: boolean | null = null;
  private lastTimestamp = Date.now();

  constructor(settings?: UserSettings) {
    this.userSettings = settings || storageService.getUserSettings();
    this.loadTodayRealState();
  }

  public updateSettings(settings: UserSettings): void {
    this.userSettings = settings;
  }

  public getSettings(): UserSettings {
    return this.userSettings;
  }

  // Load real stored state for today (from localStorage)
  private loadTodayRealState(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    const saved = storageService.getRealDayState(todayStr);
    if (saved) {
      this.dailyStrain = saved.dayStrain || 0;
      this.trimpAccumulator = this.strainToTrimp(this.dailyStrain);
      this.activeCalories = saved.activeCalories || 0;
      this.zoneSeconds = saved.zoneSeconds || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      this.realRhrObserved = saved.rhr || null;
      this.stressPoints = saved.stressPoints || [];
    }
  }

  // Persist real progress for today
  private persistTodayRealState(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentHrv = this.calculateRMSSD();
    const rhr = this.getRestingHeartRate();
    const sleepMetrics = sleepEngine.getSleepMetrics(this.userSettings, this.dailyStrain);
    const recovery = this.calculateRecovery(currentHrv, rhr, this.calculateRespiratoryRate(), sleepMetrics.sleepPerformance);
    const pedo = pedometerEngine.getState();
    const bmrToday = this.getBmrCaloriesElapsedToday();
    const totalCal = Math.round(bmrToday + this.activeCalories);

    storageService.saveRealDayState(todayStr, {
      dayStrain: this.dailyStrain,
      activeCalories: Math.round(this.activeCalories),
      rhr,
      hrv: currentHrv,
      recoveryScore: recovery.score,
      recoveryCategory: recovery.category,
      zoneSeconds: this.zoneSeconds,
      stressPoints: this.stressPoints.slice(-120), // keep latest 120 timeline points
    });

    // Also persist to Dexie production IndexedDB table
    whoopDb.saveDailyRecord({
      date: todayStr,
      timestamp: Date.now(),
      dayStrain: this.dailyStrain,
      recoveryScore: recovery.score,
      recoveryCategory: recovery.category,
      activeCalories: Math.round(this.activeCalories),
      bmrCalories: bmrToday,
      totalCalories: totalCal,
      steps: pedo.steps,
      cadence: pedo.cadence,
      rhr,
      hrv: currentHrv,
      sleepPerformance: sleepMetrics.sleepPerformance,
      hoursAsleep: sleepMetrics.hoursAsleep,
      hoursInBed: sleepMetrics.hoursInBed,
      sleepNeedHours: sleepMetrics.sleepNeedHours,
      stressAvg: this.currentStressScore,
      skinTempDelta: this.skinTempDelta,
      spO2Avg: this.getSpO2NightlyAvg(),
      zoneSeconds: { ...this.zoneSeconds },
    }).catch(() => {});
  }

  // --- Heart Rate Zones ---
  public getZones(): HrZoneInfo[] {
    const max = this.userSettings.maxHr || (220 - this.userSettings.age);
    return [
      {
        zone: 0,
        name: 'Rest',
        minBpm: 0,
        maxBpm: Math.round(max * 0.5) - 1,
        color: '#71717A',
        intensity: '<50% Max HR',
      },
      {
        zone: 1,
        name: 'Active Recovery',
        minBpm: Math.round(max * 0.5),
        maxBpm: Math.round(max * 0.6) - 1,
        color: '#0093E9',
        intensity: '50% - 60% Max HR',
      },
      {
        zone: 2,
        name: 'Aerobic Base',
        minBpm: Math.round(max * 0.6),
        maxBpm: Math.round(max * 0.7) - 1,
        color: '#16EC06',
        intensity: '60% - 70% Max HR',
      },
      {
        zone: 3,
        name: 'Tempo',
        minBpm: Math.round(max * 0.7),
        maxBpm: Math.round(max * 0.8) - 1,
        color: '#00F0FF',
        intensity: '70% - 80% Max HR',
      },
      {
        zone: 4,
        name: 'Threshold',
        minBpm: Math.round(max * 0.8),
        maxBpm: Math.round(max * 0.9) - 1,
        color: '#FFDE00',
        intensity: '80% - 90% Max HR',
      },
      {
        zone: 5,
        name: 'Max Capacity',
        minBpm: Math.round(max * 0.9),
        maxBpm: max,
        color: '#FF0026',
        intensity: '90% - 100% Max HR',
      },
    ];
  }

  public determineZone(bpm: number): 0 | 1 | 2 | 3 | 4 | 5 {
    const max = this.userSettings.maxHr || (220 - this.userSettings.age);
    if (bpm < max * 0.5) return 0;
    if (bpm < max * 0.6) return 1;
    if (bpm < max * 0.7) return 2;
    if (bpm < max * 0.8) return 3;
    if (bpm < max * 0.9) return 4;
    return 5;
  }

  // --- Real RR-Interval Ingestion & Artifact Filtering ---
  public ingestRRIntervals(intervalsMs: number[]): void {
    const now = Date.now();

    intervalsMs.forEach((rr) => {
      // 1. Strict physiological range filter: 300ms (200 bpm) to 2000ms (30 bpm)
      if (rr < 300 || rr > 2000) return;

      // 2. Ectopic beat / sudden artifact filter (> 20% jump when buffer has samples)
      if (this.rrBuffer.length >= 3) {
        const last = this.rrBuffer[this.rrBuffer.length - 1];
        const diffRatio = Math.abs(rr - last) / last;
        if (diffRatio > 0.20) {
          return; // discard ectopic anomaly
        }
      }

      // Add to Poincaré scatter plot points
      if (this.lastRR !== null) {
        this.poincarePoints.push({ rr1: this.lastRR, rr2: rr, timestamp: now });
        if (this.poincarePoints.length > 250) this.poincarePoints.shift();
      }

      this.lastRR = Math.round(rr);
      this.rrBuffer.push(rr);
      if (this.rrBuffer.length > this.maxBufferSize) {
        this.rrBuffer.shift();
      }

      // RSA Respiratory rate buffer
      this.rsaBuffer.push({ timestamp: now, rr });
    });

    // Prune RSA buffer older than 60 seconds
    const cutoff = now - 60000;
    this.rsaBuffer = this.rsaBuffer.filter((pt) => pt.timestamp >= cutoff);
  }

  // --- Real HRV Calculations (RMSSD & SDNN) ---
  public calculateRMSSD(): number | null {
    const n = this.rrBuffer.length;
    if (n < 2) return null; // Calibrating

    let sumDiffSq = 0;
    for (let i = 0; i < n - 1; i++) {
      const diff = this.rrBuffer[i + 1] - this.rrBuffer[i];
      sumDiffSq += diff * diff;
    }

    const rmssd = Math.sqrt(sumDiffSq / (n - 1));
    return Math.round(rmssd);
  }

  public calculateSDNN(): number | null {
    const n = this.rrBuffer.length;
    if (n < 2) return null;

    const mean = this.rrBuffer.reduce((a, b) => a + b, 0) / n;
    const variance = this.rrBuffer.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
    return Math.round(Math.sqrt(variance));
  }

  public getMeanRR(): number | null {
    if (this.rrBuffer.length === 0) return null;
    return Math.round(this.rrBuffer.reduce((a, b) => a + b, 0) / this.rrBuffer.length);
  }

  public getLastRR(): number | null {
    return this.lastRR;
  }

  public getPoincarePoints(): PoincarePoint[] {
    return [...this.poincarePoints];
  }

  public getStressPoints(): StressPoint[] {
    return [...this.stressPoints];
  }

  // --- Poincaré SD1 (Parasympathetic) and SD2 (Sympathetic) ---
  public calculateSD1AndSD2(): { sd1: number | null; sd2: number | null } {
    const rmssd = this.calculateRMSSD();
    const sdnn = this.calculateSDNN();
    if (rmssd === null || sdnn === null) return { sd1: null, sd2: null };

    // SD1 = RMSSD / sqrt(2)
    const sd1 = Math.round(rmssd / Math.SQRT2);
    // SD2 = sqrt(2 * SDNN^2 - 0.5 * RMSSD^2)
    const sd2 = Math.round(Math.sqrt(Math.max(0, 2 * sdnn * sdnn - 0.5 * rmssd * rmssd)));
    return { sd1, sd2 };
  }

  // --- Baevsky Stress Index (SI = AMo / (2 * Mo * MxDMn)) ---
  public calculateBaevskyStressIndex(): number | null {
    if (this.rrBuffer.length < 20) return null;
    const sorted = [...this.rrBuffer].sort((a, b) => a - b);
    const minRR = sorted[0] / 1000.0;
    const maxRR = sorted[sorted.length - 1] / 1000.0;
    const mxDMn = maxRR - minRR; // Range in seconds
    if (mxDMn <= 0.05) return null;

    // Bin into 50ms bins
    const bins: Record<number, number> = {};
    sorted.forEach((rr) => {
      const bin = Math.round(rr / 50) * 50;
      bins[bin] = (bins[bin] || 0) + 1;
    });

    let maxBinCount = 0;
    let modeRR = 800;
    for (const [binStr, count] of Object.entries(bins)) {
      if (count > maxBinCount) {
        maxBinCount = count;
        modeRR = Number(binStr);
      }
    }

    const Mo = modeRR / 1000.0; // Mode in seconds
    const AMo = (maxBinCount / sorted.length) * 100; // Amplitude of mode in %

    const si = AMo / (2 * Mo * mxDMn);
    return Math.round(si);
  }

  // --- Real Respiratory Rate via Respiratory Sinus Arrhythmia (RSA) ---
  public calculateRespiratoryRate(): number | null {
    const n = this.rsaBuffer.length;
    if (n < 15) return null; // Calibrating

    const timeSpanSec = (this.rsaBuffer[n - 1].timestamp - this.rsaBuffer[0].timestamp) / 1000;
    if (timeSpanSec < 25) return null; // Need at least 25-30s clean window

    // Moving average smoothing (window = 3)
    const smoothed: number[] = [];
    for (let i = 1; i < n - 1; i++) {
      smoothed.push((this.rsaBuffer[i - 1].rr + this.rsaBuffer[i].rr + this.rsaBuffer[i + 1].rr) / 3);
    }

    // Detect modulation peak-to-trough cycles
    let peaks = 0;
    for (let i = 1; i < smoothed.length - 1; i++) {
      if (smoothed[i] > smoothed[i - 1] && smoothed[i] > smoothed[i + 1]) {
        peaks++;
      }
    }

    if (peaks < 2) return null;

    const rpm = (peaks * 60) / timeSpanSec;
    // Clamp to realistic physiological human respiratory range
    return Number(Math.min(24.0, Math.max(10.0, rpm)).toFixed(1));
  }

  // --- Real Autonomic Stress Score (0.0 to 3.0 Scale) ---
  public computeStressScore(bpm: number, rmssd: number | null): { score: number; category: 'low' | 'medium' | 'high' } | null {
    if (!bpm || rmssd === null) return null;

    const rhr = this.getRestingHeartRate() || this.userSettings.restingHrBaseline;
    const maxHr = this.userSettings.maxHr || (220 - this.userSettings.age);
    const hrvBase = this.userSettings.hrvBaseline;

    // HR elevation above RHR
    const hrElevation = Math.max(0, Math.min(1, (bpm - rhr) / Math.max(30, maxHr - rhr)));

    // HRV suppression below baseline
    const hrvSuppression = Math.max(0, Math.min(1, 1 - (rmssd / Math.max(20, hrvBase))));

    // Composite stress metric
    const rawScore = (hrElevation * 1.8) + (hrvSuppression * 1.2);
    const score = Number(Math.min(3.0, Math.max(0.0, rawScore)).toFixed(1));

    let category: 'low' | 'medium' | 'high' = 'low';
    if (score >= 2.0) category = 'high';
    else if (score >= 1.0) category = 'medium';

    return { score, category };
  }

  public getStressTimeline(): StressPoint[] {
    return [...this.stressPoints];
  }

  // --- Real Calories Burned (Keytel Equation) ---
  private calculateCaloriesPerSecond(bpm: number): number {
    const { gender, weightKg, age } = this.userSettings;
    let calPerMin = 0;

    if (gender === 'male') {
      calPerMin = (-55.0969 + 0.6309 * bpm + 0.1988 * weightKg + 0.2017 * age) / 4.184;
    } else {
      calPerMin = (-20.4022 + 0.4472 * bpm - 0.1263 * weightKg + 0.074 * age) / 4.184;
    }

    return Math.max(0, calPerMin / 60);
  }

  // --- Mifflin-St Jeor Basal Metabolic Rate (BMR) ---
  public calculateDailyBmr(settings?: UserSettings): number {
    const s = settings || this.userSettings;
    const { gender, weightKg, heightCm, age } = s;
    const h = heightCm || 178;
    if (gender === 'male') {
      return (10 * weightKg) + (6.25 * h) - (5 * age) + 5;
    } else {
      return (10 * weightKg) + (6.25 * h) - (5 * age) - 161;
    }
  }

  public getBmrCaloriesElapsedToday(): number {
    const now = new Date();
    const minutesSinceMidnight = (now.getHours() * 60) + now.getMinutes() + (now.getSeconds() / 60);
    const dailyBmr = this.calculateDailyBmr();
    return Math.round((dailyBmr / 1440) * minutesSinceMidnight);
  }

  public getTotalDailyCalories(): number {
    return Math.round(this.getBmrCaloriesElapsedToday() + this.activeCalories);
  }

  // --- Health Monitor Ingestion (Skin Temp & SpO2) ---
  public ingestSkinTemp(celsius: number): void {
    this.skinTempCelsius = Number(celsius.toFixed(1));
    const baseline = 33.5; // WHOOP skin temperature baseline reference
    this.skinTempDelta = Number((celsius - baseline).toFixed(1));
  }

  public ingestSpO2(percent: number): void {
    if (percent >= 70 && percent <= 100) {
      this.spO2 = Math.round(percent);
      this.spO2Readings.push(this.spO2);
      if (this.spO2Readings.length > 500) this.spO2Readings.shift();
      if (percent < 95) {
        this.spO2DipsCount++;
      }
    }
  }

  public getSpO2NightlyAvg(): number | null {
    if (this.spO2Readings.length === 0) return null;
    const sum = this.spO2Readings.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.spO2Readings.length);
  }

  public getSkinTempState(): { celsius: number | null; delta: number | null } {
    return { celsius: this.skinTempCelsius, delta: this.skinTempDelta };
  }

  public getSpO2State(): { current: number | null; nightlyAvg: number | null; dips: number } {
    return { current: this.spO2, nightlyAvg: this.getSpO2NightlyAvg(), dips: this.spO2DipsCount };
  }

  // --- Real Day Strain (0.0 to 21.0 Logarithmic Scale) ---
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

  // --- True Resting Heart Rate (lowest rolling 5-min avg) ---
  public getRestingHeartRate(): number | null {
    return this.realRhrObserved;
  }

  // --- Real Recovery % (1 - 100% via standard normal CDF) ---
  public calculateRecovery(
    currentHrv: number | null,
    currentRhr: number | null,
    currentResp: number | null = null,
    sleepPerformance: number | null = null
  ): { score: number | null; category: 'green' | 'yellow' | 'red' | 'calibrating' } {
    if (currentHrv === null || currentRhr === null) {
      return { score: null, category: 'calibrating' };
    }

    const avgHrvBase = this.userSettings.hrvBaseline;
    const avgRhrBase = this.userSettings.restingHrBaseline;

    // Standardized z-scores
    const zHrv = (currentHrv - avgHrvBase) / Math.max(15, avgHrvBase * 0.25);
    const zRhr = (currentRhr - avgRhrBase) / 5.0;
    const zResp = currentResp !== null ? (currentResp - 14.5) / 1.8 : 0;
    const zSleep = sleepPerformance !== null ? (sleepPerformance - 85.0) / 12.0 : 0;

    // Official WHOOP linear combination
    const compositeZ = (0.55 * zHrv) - (0.20 * zRhr) - (0.10 * zResp) + (0.15 * zSleep);
    const cdf = 0.5 * (1 + this.approxErf(compositeZ / Math.SQRT2));
    let score = Math.round(cdf * 100);
    score = Math.min(99, Math.max(1, score));

    let category: 'green' | 'yellow' | 'red' = 'yellow';
    if (score >= 67) {
      category = 'green';
    } else if (score <= 33) {
      category = 'red';
    }

    return { score, category };
  }

  private approxErf(x: number): number {
    const sign = x >= 0 ? 1 : -1;
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const absX = Math.abs(x);
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
    return sign * y;
  }

  // --- VO2 Max (Uth-Sørensen-Overgaard-Pedersen Formula) ---
  public calculateVo2Max(): number | null {
    const rhr = this.getRestingHeartRate() || this.userSettings.restingHrBaseline;
    const maxHr = this.userSettings.maxHr || (220 - this.userSettings.age);
    if (!rhr || rhr <= 0) return null;
    const baseVo2 = 15.3 * (maxHr / rhr);
    const volumeBonus = Math.min(4.0, (this.dailyStrain / 21.0) * 3.5);
    return Number((baseVo2 + volumeBonus).toFixed(1));
  }

  // --- Add Muscular Load from Strength Trainer ---
  public addMuscularLoad(muscularLoad: number): void {
    if (muscularLoad <= 0) return;
    this.trimpAccumulator += muscularLoad * 0.15;
    this.dailyStrain = this.calculateStrainFromTrimp(this.trimpAccumulator);
    this.persistTodayRealState();
  }

  // --- Real Biological Healthspan (WHOOP Age & Pace of Aging) ---
  public calculateHealthspan(): { whoopAge: number | null; paceOfAging: number | null } {
    const hrv = this.calculateRMSSD();
    const rhr = this.getRestingHeartRate();

    if (hrv === null || rhr === null) {
      return { whoopAge: null, paceOfAging: null };
    }

    const hrvRatio = (hrv - this.userSettings.hrvBaseline) / Math.max(20, this.userSettings.hrvBaseline);
    const rhrRatio = (this.userSettings.restingHrBaseline - rhr) / Math.max(30, this.userSettings.restingHrBaseline);

    const deltaYears = (hrvRatio * 5.0) + (rhrRatio * 3.0);
    const whoopAge = Math.round(Math.max(18, this.userSettings.age - deltaYears));
    const pace = Number(Math.min(1.40, Math.max(0.60, 1.0 - (deltaYears * 0.04))).toFixed(2));

    return { whoopAge, paceOfAging: pace };
  }

  // --- Core Real-Time Ingest Sample from BLE ---
  public ingestSample(measurement: HeartRateMeasurement): LiveMetrics {
    const { bpm, rrIntervals, onWrist, timestamp } = measurement;
    this.lastBpm = bpm;
    this.lastWristStatus = onWrist;
    this.lastTimestamp = timestamp;

    // 1. Process RR intervals
    if (rrIntervals && rrIntervals.length > 0) {
      this.ingestRRIntervals(rrIntervals);
    }

    // 2. Process Heart Rate
    if (bpm > 0) {
      this.hrCount += 1;
      this.hrSum += bpm;
      if (this.minHrObserved === null || bpm < this.minHrObserved) this.minHrObserved = bpm;
      if (this.maxHrObserved === null || bpm > this.maxHrObserved) this.maxHrObserved = bpm;

      // Track rolling 5-minute samples for true RHR
      this.rolling5MinSamples.push({ timestamp, bpm });
      const cutoff5Min = timestamp - 300000;
      this.rolling5MinSamples = this.rolling5MinSamples.filter((s) => s.timestamp >= cutoff5Min);

      // If at least 2 minutes of continuous data exists, compute rolling average
      if (this.rolling5MinSamples.length >= 60) {
        const sum5 = this.rolling5MinSamples.reduce((acc, s) => acc + s.bpm, 0);
        const avg5 = Math.round(sum5 / this.rolling5MinSamples.length);
        if (this.realRhrObserved === null || avg5 < this.realRhrObserved) {
          this.realRhrObserved = avg5;
        }
      }

      // Zone & Strain Accumulation
      const zone = this.determineZone(bpm);
      this.zoneSeconds[zone] = (this.zoneSeconds[zone] || 0) + 1;

      if (zone >= 1) {
        const zoneWeights: Record<number, number> = { 1: 1.0, 2: 2.0, 3: 3.5, 4: 5.5, 5: 9.0 };
        const weight = zoneWeights[zone] || 1.0;
        this.trimpAccumulator += weight / 60.0;
        this.dailyStrain = this.calculateStrainFromTrimp(this.trimpAccumulator);
      }

      // Calories Accumulation
      this.activeCalories += this.calculateCaloriesPerSecond(bpm);

      // Ingest into Pedometer Activity-Cadence Model
      pedometerEngine.ingestHeartRate(bpm, zone, timestamp);
    }

    // 3. Sleep Engine Ingestion & Metrics
    const currentHrv = this.calculateRMSSD();
    const rhr = this.getRestingHeartRate();
    sleepEngine.ingestSample(bpm, currentHrv, onWrist, rhr || this.userSettings.restingHrBaseline, timestamp);
    const sleepMetrics = sleepEngine.getSleepMetrics(this.userSettings, this.dailyStrain);

    // 4. Compute Metrics
    const sdnn = this.calculateSDNN();
    const meanRR = this.getMeanRR();
    const lastRR = this.getLastRR();
    const respiratoryRate = this.calculateRespiratoryRate();
    const recovery = this.calculateRecovery(currentHrv, rhr, respiratoryRate, sleepMetrics.sleepPerformance);
    const pedo = pedometerEngine.getState();
    const bmrToday = this.getBmrCaloriesElapsedToday();
    const totalCalories = Math.round(bmrToday + this.activeCalories);

    // 5. Ingest into Dexie Telemetry Buffer
    if (bpm > 0 && this.hrCount % 5 === 0) {
      whoopDb.logTelemetry({
        timestamp,
        bpm,
        rrIntervals: rrIntervals || [],
        stress: this.currentStressScore || undefined,
        skinTemp: this.skinTempCelsius || undefined,
        spO2: this.spO2 || undefined,
      }).catch(() => {});
    }

    // 6. Compute Stress Score every 5 seconds
    if (timestamp - this.lastStressTick >= 5000) {
      this.lastStressTick = timestamp;
      const stressResult = this.computeStressScore(bpm, currentHrv);
      if (stressResult) {
        this.currentStressScore = stressResult.score;
        const timeLabel = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.stressPoints.push({
          timestamp,
          timeLabel,
          score: stressResult.score,
          category: stressResult.category,
        });
        if (this.stressPoints.length > 200) this.stressPoints.shift();

        // Check for resting stress alert
        notificationEngine.checkHighStress(this.currentStressScore, false);
      }
    }

    // 7. Persist every 15 beats
    if (this.hrCount % 15 === 0) {
      this.persistTodayRealState();
    }

    const optimalTargetMin = recovery.score
      ? Number((4.0 + (recovery.score / 100) * 10.0).toFixed(1))
      : 8.0;
    const optimalTargetMax = Number(Math.min(20.5, optimalTargetMin + 3.2).toFixed(1));

    // Check if daily strain reached optimal target range
    notificationEngine.checkStrainTarget(this.dailyStrain, optimalTargetMin);

    let stressCat: 'low' | 'medium' | 'high' | null = null;
    if (this.currentStressScore !== null) {
      stressCat = this.currentStressScore >= 2.0 ? 'high' : this.currentStressScore >= 1.0 ? 'medium' : 'low';
    }

    return {
      currentHr: bpm > 0 ? bpm : null,
      currentHrv,
      sdnn,
      meanRR,
      lastRR,
      minHr: this.minHrObserved,
      maxHr: this.maxHrObserved,
      avgHr: this.hrCount > 0 ? Math.round(this.hrSum / this.hrCount) : null,
      restingHr: rhr,
      dailyStrain: this.dailyStrain,
      recoveryScore: recovery.score,
      recoveryCategory: recovery.category,
      sleepPerformance: sleepMetrics.sleepPerformance,
      activeCalories: Math.round(this.activeCalories),
      bmrCalories: bmrToday,
      totalCalories,
      steps: pedo.steps,
      cadence: pedo.cadence,
      stepSource: pedo.source,
      currentZone: bpm > 0 ? this.determineZone(bpm) : 0,
      zoneSeconds: { ...this.zoneSeconds },
      optimalStrainTarget: { min: optimalTargetMin, max: optimalTargetMax },
      respiratoryRate,
      stressScore: this.currentStressScore,
      stressCategory: stressCat,
      skinTempCelsius: this.skinTempCelsius,
      skinTempDelta: this.skinTempDelta,
      spO2: this.spO2,
      spO2NightlyAvg: this.getSpO2NightlyAvg(),
      spO2DipsCount: this.spO2DipsCount,
      vo2Max: this.calculateVo2Max(),
      sd1: this.calculateSD1AndSD2().sd1,
      sd2: this.calculateSD1AndSD2().sd2,
      baevskyIndex: this.calculateBaevskyStressIndex(),
      onWrist,
      timestamp,
    };
  }

  // --- Real Disconnected / Initial State (Zero Fake Numbers) ---
  public getInitialDisconnectedMetrics(): LiveMetrics {
    const todayStr = new Date().toISOString().split('T')[0];
    const saved = storageService.getRealDayState(todayStr);
    const pedo = pedometerEngine.getState();
    const bmrToday = this.getBmrCaloriesElapsedToday();
    const totalCalories = Math.round(bmrToday + (saved?.activeCalories || 0));
    const sleepMetrics = sleepEngine.getSleepMetrics(this.userSettings, saved?.dayStrain || 0);

    return {
      currentHr: null,
      currentHrv: saved?.hrv || null,
      sdnn: null,
      meanRR: null,
      lastRR: null,
      minHr: null,
      maxHr: null,
      avgHr: null,
      restingHr: saved?.rhr || null,
      dailyStrain: saved?.dayStrain || 0,
      recoveryScore: saved?.recoveryScore || null,
      recoveryCategory: saved?.recoveryCategory || 'calibrating',
      sleepPerformance: sleepMetrics.sleepPerformance,
      activeCalories: saved?.activeCalories || 0,
      bmrCalories: bmrToday,
      totalCalories,
      steps: pedo.steps,
      cadence: pedo.cadence,
      stepSource: pedo.source,
      currentZone: 0,
      zoneSeconds: saved?.zoneSeconds || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      optimalStrainTarget: { min: 8.0, max: 12.0 },
      respiratoryRate: null,
      stressScore: null,
      stressCategory: null,
      skinTempCelsius: this.skinTempCelsius,
      skinTempDelta: this.skinTempDelta,
      spO2: this.spO2,
      spO2NightlyAvg: this.getSpO2NightlyAvg(),
      spO2DipsCount: this.spO2DipsCount,
      vo2Max: this.calculateVo2Max(),
      sd1: null,
      sd2: null,
      baevskyIndex: null,
      onWrist: null,
      timestamp: Date.now(),
    };
  }

  // --- Real Workout Evaluation ---
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
        avgHrv: 0,
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
    this.zoneSeconds = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    this.activeCalories = 0;
    this.dailyStrain = 0;
    this.trimpAccumulator = 0;
    this.hrCount = 0;
    this.hrSum = 0;
    this.minHrObserved = null;
    this.maxHrObserved = null;
    this.realRhrObserved = null;
    this.rrBuffer = [];
    this.rsaBuffer = [];
    this.rolling5MinSamples = [];
    this.stressPoints = [];
    this.currentStressScore = null;
    this.poincarePoints = [];

    const todayStr = new Date().toISOString().split('T')[0];
    storageService.clearRealDayState(todayStr);
  }
}

export const biometricEngine = new BiometricEngine();
export const metricsEngine = biometricEngine;
