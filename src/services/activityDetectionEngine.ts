import type { SessionRecord, UserSettings } from '../types/whoop';
import { storageService } from './StorageService';
import { notificationEngine } from './notificationEngine';
import { hapticSuccess, hapticMedium } from '../utils/haptics';
import { banisterTrimpIncrement, calculateStrainFromTrimp } from '../utils/strainModel';
import { localDateKey } from '../utils/dateKey';

export interface DetectedActivity {
  id: string;
  sport: string;
  startTime: number;
  endTime: number;
  durationSec: number;
  avgHr: number;
  maxHr: number;
  minHr: number;
  strain: number;
  calories: number;
  avgHrv: number;
  zoneDistribution: Record<number, number>;
  dataPoints: Array<{ timestamp: number; hr: number; hrv: number; strain?: number }>;
  detectedAt: number;
  cadenceAvg: number;
}

interface ActivitySample {
  timestamp: number;
  hr: number;
  hrv: number;
  cadence: number;
  motionIntensity: number;
}

const STORAGE_PENDING_KEY = 'whoop_pending_detected_activity';

// 12 minutes (720s) of sustained elevation required to trigger automatic activity flag
const REQUIRED_ELEVATION_SEC = 720;
// 5 minutes (300s) of continuous resting/baseline HR to auto-close the session
const BASELINE_COOLDOWN_SEC = 300;

export class ActivityDetectionEngine {
  private subscribers = new Set<() => void>();
  private pendingActivity: DetectedActivity | null = null;

  // Real-time tracking state
  private candidateStartTime: number | null = null;
  private candidateSamples: ActivitySample[] = [];
  private isTrackingActive = false;
  private lowHrStartTime: number | null = null;
  private lastNonElevatedTime: number | null = null;

  constructor() {
    this.pendingActivity = this.loadPending();
  }

  private loadPending(): DetectedActivity | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_PENDING_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }

  private persistPending(activity: DetectedActivity | null): void {
    if (typeof localStorage === 'undefined') return;
    try {
      if (activity) {
        localStorage.setItem(STORAGE_PENDING_KEY, JSON.stringify(activity));
      } else {
        localStorage.removeItem(STORAGE_PENDING_KEY);
      }
    } catch {}
  }

  public getPendingActivity(): DetectedActivity | null {
    return this.pendingActivity;
  }

  public isCurrentlyTracking(): boolean {
    return this.isTrackingActive;
  }

  public getCandidateElapsedSec(): number {
    if (!this.candidateStartTime) return 0;
    return Math.max(0, Math.round((Date.now() - this.candidateStartTime) / 1000));
  }

  public subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify(): void {
    this.subscribers.forEach((cb) => {
      try {
        cb();
      } catch {}
    });
  }

  /**
   * Continuous biometric sample ingestion from BiometricEngine
   */
  public ingestSample(params: {
    bpm: number;
    hrv: number | null;
    cadence: number;
    motionIntensity: number;
    timestamp: number;
    onWrist: boolean;
    dtSec: number;
    settings: UserSettings;
    rhr: number;
  }): void {
    const { bpm, hrv, cadence, motionIntensity, timestamp, onWrist, settings, rhr } = params;

    // Disregard off-wrist or sensor noise
    if (!onWrist || bpm < 35 || bpm > 240) {
      if (this.isTrackingActive) {
        // Band removed during active workout - track drop
        if (this.lowHrStartTime === null) this.lowHrStartTime = timestamp;
      }
      return;
    }

    // Zone 2+ elevation condition: HR >= 60% HR Max OR HR >= RHR + 35 bpm
    const maxHrUser = settings.maxHr || 220 - settings.age;
    const hrZone2Threshold = Math.min(maxHrUser * 0.60, rhr + 35);
    const isElevated = bpm >= hrZone2Threshold;
    const baselineThreshold = rhr + 15;

    const sample: ActivitySample = {
      timestamp,
      hr: bpm,
      hrv: hrv || 40,
      cadence,
      motionIntensity,
    };

    // --- PHASE 1: Not yet an active workout ---
    if (!this.isTrackingActive) {
      if (isElevated) {
        if (this.candidateStartTime === null) {
          this.candidateStartTime = timestamp;
          this.candidateSamples = [];
        }
        this.candidateSamples.push(sample);
        this.lastNonElevatedTime = null;

        const elapsedSec = (timestamp - this.candidateStartTime) / 1000;
        // Sustained effort > 12 minutes (720s) reached: promote to active activity
        if (elapsedSec >= REQUIRED_ELEVATION_SEC && this.candidateSamples.length >= 60) {
          console.log(`[ACTIVITY ENGINE] ⚡ 12-Minute Effort Threshold Reached! Auto-activity flagged.`);
          this.isTrackingActive = true;
          this.notify();
        }
      } else {
        // Effort dipped below threshold during candidate phase
        if (this.candidateStartTime !== null) {
          if (this.lastNonElevatedTime === null) {
            this.lastNonElevatedTime = timestamp;
          } else if ((timestamp - this.lastNonElevatedTime) / 1000 > 90) {
            // Effort dipped for > 90 continuous seconds before reaching 12 min - reset candidate
            this.candidateStartTime = null;
            this.candidateSamples = [];
            this.lastNonElevatedTime = null;
          }
        }
      }
      return;
    }

    // --- PHASE 2: Active ongoing workout session ---
    this.candidateSamples.push(sample);

    // Auto-Close & Cooldown Trimming:
    // Conclude workout when HR returns to baseline (<= RHR + 15) and cadence stops (<= 30) for >= 5 minutes (300s)
    const isAtRest = bpm <= baselineThreshold && cadence <= 30;
    if (isAtRest) {
      if (this.lowHrStartTime === null) {
        this.lowHrStartTime = timestamp;
      } else {
        const cooldownSec = (timestamp - this.lowHrStartTime) / 1000;
        if (cooldownSec >= BASELINE_COOLDOWN_SEC) {
          // Session completed! Auto-close and compile metrics
          // Automatically trim the 5-minute cooldown period from the final recorded workout duration
          const actualEndTime = this.lowHrStartTime;
          this.finalizeDetectedSession(actualEndTime, settings, rhr);
        }
      }
    } else {
      // HR or cadence spiked back up, cancel baseline cooldown timer
      this.lowHrStartTime = null;
    }
  }

  /**
   * Finalizes the detected activity session, performs WHOOP 5-way sport classification,
   * trims cooldown, and produces interactive confirmation banner
   */
  private finalizeDetectedSession(
    endTime: number,
    settings: UserSettings,
    rhr: number
  ): void {
    if (!this.candidateStartTime || this.candidateSamples.length < 30) {
      this.resetTracking();
      return;
    }

    const startTime = this.candidateStartTime;
    // Filter samples within true activity duration (excluding final cooldown)
    const activeSamples = this.candidateSamples.filter((s) => s.timestamp <= endTime);
    if (activeSamples.length === 0) {
      this.resetTracking();
      return;
    }

    const durationSec = Math.max(60, Math.round((endTime - startTime) / 1000));
    let minHr = 999;
    let maxHr = 0;
    let hrSum = 0;
    let hrvSum = 0;
    let cadenceSum = 0;
    let sessionTrimp = 0;
    const sessionZones: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    const isFemale = settings.gender === 'female';
    const maxHrUser = settings.maxHr || 220 - settings.age;

    activeSamples.forEach((s) => {
      if (s.hr < minHr) minHr = s.hr;
      if (s.hr > maxHr) maxHr = s.hr;
      hrSum += s.hr;
      hrvSum += s.hrv;
      cadenceSum += s.cadence;

      // Estimate Zone
      const reserve = Math.max(20, maxHrUser - rhr);
      const intensity = (s.hr - rhr) / reserve;
      let zone: number = 1;
      if (intensity >= 0.9) zone = 5;
      else if (intensity >= 0.8) zone = 4;
      else if (intensity >= 0.7) zone = 3;
      else if (intensity >= 0.6) zone = 2;
      else zone = 1;

      sessionZones[zone] = (sessionZones[zone] || 0) + 1;
      sessionTrimp += banisterTrimpIncrement(s.hr, rhr, maxHrUser, isFemale, 1);
    });

    const avgHr = Math.round(hrSum / activeSamples.length);
    const avgHrv = Math.round(hrvSum / activeSamples.length);
    const avgCadence = Math.round(cadenceSum / activeSamples.length);
    const strain = calculateStrainFromTrimp(sessionTrimp);

    // Standard deviation metrics for physiological classification
    const hrMean = hrSum / activeSamples.length;
    const hrVariance =
      activeSamples.reduce((acc, s) => acc + Math.pow(s.hr - hrMean, 2), 0) /
      activeSamples.length;
    const hrStdDev = Math.sqrt(hrVariance);

    // Track Zone 4/5 oscillation frequency for HIIT detection
    let zoneOscillations = 0;
    let prevZoneHigh: boolean | null = null;
    activeSamples.forEach((s) => {
      const isHigh = s.hr >= maxHrUser * 0.8;
      const isLow = s.hr <= rhr + (maxHrUser - rhr) * 0.6;
      if (isHigh && prevZoneHigh === false) zoneOscillations++;
      if (isLow && prevZoneHigh === true) zoneOscillations++;
      if (isHigh) prevZoneHigh = true;
      else if (isLow) prevZoneHigh = false;
    });

    const highZoneRatio =
      (sessionZones[4] + sessionZones[5]) / Math.max(1, activeSamples.length);

    // --- 5 WHOOP Multi-Sport Classification Heuristics ---
    let inferredSport = 'Functional Fitness';
    if (avgCadence >= 138) {
      // 1. Running: Sustained high cadence (>= 138 SPM) and progressive heart rate drift
      inferredSport = 'Running';
    } else if (avgCadence >= 75 && avgCadence < 138 && avgHr <= rhr + 48) {
      // 2. Walking: Moderate cadence (75 - 134 SPM) and steady Zone 1-2 heart rate
      inferredSport = 'Walking';
    } else if (zoneOscillations >= 4 || (hrStdDev >= 18 && highZoneRatio >= 0.15)) {
      // 3. HIIT: Rapid oscillation between Zone 4/5 and Zone 2 recovery intervals
      inferredSport = 'HIIT';
    } else if (avgCadence < 40 && avgHr >= rhr + 30 && hrStdDev < 14) {
      // 4. Cycling / Stationary: Elevated HR with minimal wrist shock / low cadence (< 40 SPM or steady flywheel cadence)
      inferredSport = 'Cycling';
    } else if (avgCadence < 65 && (hrStdDev >= 12 || avgHr >= rhr + 35)) {
      // 5. Weightlifting / Functional Fitness: Bursts of elevated HR and HRV drops interspersed with rest intervals
      inferredSport = 'Weightlifting';
    } else if (avgCadence >= 70) {
      inferredSport = 'Walking';
    } else {
      inferredSport = 'Functional Fitness';
    }

    // Approximate Active Calories: Keytel formula estimate
    const calPerSec = Math.max(0.015, (avgHr * 0.2017 + (settings.weightKg || 75) * 0.1988 - 55.0969) / 60 / 4.184);
    const calories = Math.round(calPerSec * durationSec);

    const detected: DetectedActivity = {
      id: `detected-${Date.now()}`,
      sport: inferredSport,
      startTime,
      endTime,
      durationSec,
      avgHr,
      maxHr,
      minHr: minHr === 999 ? avgHr : minHr,
      strain,
      calories,
      avgHrv,
      zoneDistribution: sessionZones,
      dataPoints: activeSamples.map((s) => ({
        timestamp: s.timestamp,
        hr: s.hr,
        hrv: s.hrv,
      })),
      detectedAt: Date.now(),
      cadenceAvg: avgCadence,
    };

    this.pendingActivity = detected;
    this.persistPending(detected);
    this.resetTracking();

    console.log(`[ACTIVITY ENGINE] ✓ Auto-Activity Detected: ${detected.sport} (${Math.round(durationSec / 60)}m, Strain ${strain})`);

    // Post system alert toast
    notificationEngine.addNotification({
      type: 'strain',
      title: 'تم رصد نشاط رياضي تلقائياً',
      message: `${detected.sport}: ${Math.round(durationSec / 60)} دقيقة • ${strain.toFixed(1)} جهد. انقر للتأكيد والحفظ.`,
      priority: 'high',
      actionLabel: 'تأكيد',
      actionType: 'confirm_detected_activity',
    });

    this.notify();
  }

  private resetTracking(): void {
    this.candidateStartTime = null;
    this.candidateSamples = [];
    this.isTrackingActive = false;
    this.lowHrStartTime = null;
    this.lastNonElevatedTime = null;
  }

  /**
   * User confirms detected activity -> converts to official SessionRecord & saves to DB
   */
  public async confirmPendingActivity(customSport?: string): Promise<SessionRecord | null> {
    if (!this.pendingActivity) return null;

    const activity = this.pendingActivity;
    const finalSport = customSport || activity.sport;

    const session: SessionRecord = {
      id: activity.id,
      type: 'workout',
      title: finalSport,
      sport: finalSport,
      startTime: activity.startTime,
      endTime: activity.endTime,
      durationSec: activity.durationSec,
      avgHr: activity.avgHr,
      maxHr: activity.maxHr,
      minHr: activity.minHr,
      strain: activity.strain,
      calories: activity.calories,
      avgHrv: activity.avgHrv,
      zoneDistribution: activity.zoneDistribution,
      dataPoints: activity.dataPoints,
      notes: `Auto-detected activity via WHOOP 4.0 optical telemetry.`,
    };

    await storageService.saveSession(session);
    this.pendingActivity = null;
    this.persistPending(null);
    hapticSuccess();
    this.notify();

    return session;
  }

  /**
   * User discards false detection
   */
  public discardPendingActivity(): void {
    this.pendingActivity = null;
    this.persistPending(null);
    hapticMedium();
    this.notify();
  }

  /**
   * Simulate Auto-Detected Workout (e.g. 30m Run, 8.5 Strain)
   * Injects telemetry, triggers confirmation banner, and allows saving to "أنشطة اليوم".
   */
  public simulateDetectedWorkout(
    sport: string = 'Running',
    durationMinutes: number = 30,
    targetStrain: number = 8.5
  ): DetectedActivity {
    const now = Date.now();
    const durationSec = durationMinutes * 60;
    const startTime = now - durationSec * 1000;
    const endTime = now;

    let avgHr = 154;
    let maxHr = 178;
    let minHr = 108;
    let avgCadence = 152;
    let calories = 312;

    if (sport === 'Running') {
      avgHr = 154;
      maxHr = 178;
      minHr = 108;
      avgCadence = 152;
      calories = 312;
    } else if (sport === 'Walking') {
      avgHr = 108;
      maxHr = 126;
      minHr = 78;
      avgCadence = 102;
      calories = 145;
    } else if (sport === 'Cycling') {
      avgHr = 142;
      maxHr = 168;
      minHr = 95;
      avgCadence = 22;
      calories = 265;
    } else if (sport === 'Weightlifting') {
      avgHr = 132;
      maxHr = 166;
      minHr = 88;
      avgCadence = 15;
      calories = 210;
    } else if (sport === 'HIIT') {
      avgHr = 160;
      maxHr = 184;
      minHr = 92;
      avgCadence = 85;
      calories = 340;
    }

    const testActivity: DetectedActivity = {
      id: `detected-${Date.now()}`,
      sport,
      startTime,
      endTime,
      durationSec,
      avgHr,
      maxHr,
      minHr,
      strain: targetStrain,
      calories,
      avgHrv: 52,
      zoneDistribution: {
        1: Math.round(durationSec * 0.1),
        2: Math.round(durationSec * 0.25),
        3: Math.round(durationSec * 0.35),
        4: Math.round(durationSec * 0.2),
        5: Math.round(durationSec * 0.1),
      },
      dataPoints: [],
      detectedAt: now,
      cadenceAvg: avgCadence,
    };

    this.pendingActivity = testActivity;
    this.persistPending(testActivity);
    this.resetTracking();

    notificationEngine.addNotification({
      type: 'strain',
      title: 'تم رصد نشاط رياضي تلقائياً',
      message: `${sport}: ${durationMinutes} دقيقة • ${targetStrain.toFixed(1)} جهد. انقر للتأكيد والحفظ.`,
      priority: 'high',
      actionLabel: 'تأكيد',
      actionType: 'confirm_detected_activity',
    });

    this.notify();
    return testActivity;
  }

  /**
   * Diagnostic test trigger
   */
  public triggerTestActivity(sport: string = 'Running', durationMinutes: number = 24): DetectedActivity {
    return this.simulateDetectedWorkout(sport, durationMinutes, 10.4);
  }
}

export const activityDetectionEngine = new ActivityDetectionEngine();
