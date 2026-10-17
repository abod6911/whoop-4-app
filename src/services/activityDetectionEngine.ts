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

    // Zone 2+ elevation condition: HR > RHR + 25 bpm AND physical motion
    const hrElevationThreshold = rhr + 25;
    const isElevated = bpm >= hrElevationThreshold && (motionIntensity >= 0.12 || bpm >= rhr + 35);
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
        // Sustained effort > 12 minutes reached: promote to active activity
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

    // Check for session completion (HR returns to baseline for > 5 continuous minutes)
    if (bpm <= baselineThreshold) {
      if (this.lowHrStartTime === null) {
        this.lowHrStartTime = timestamp;
      } else {
        const cooldownSec = (timestamp - this.lowHrStartTime) / 1000;
        if (cooldownSec >= BASELINE_COOLDOWN_SEC) {
          // Session completed! Auto-close and compile metrics
          const actualEndTime = this.lowHrStartTime;
          this.finalizeDetectedSession(actualEndTime, settings, rhr);
        }
      }
    } else {
      // HR spiked back up, cancel baseline cooldown timer
      this.lowHrStartTime = null;
    }
  }

  /**
   * Finalizes the detected activity session and produces interactive confirmation banner
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

    // Approximate Active Calories: Keytel formula estimate
    const calPerSec = Math.max(0.015, (avgHr * 0.2017 + (settings.weightKg || 75) * 0.1988 - 55.0969) / 60 / 4.184);
    const calories = Math.round(calPerSec * durationSec);

    // Infer sport by cadence and movement
    let inferredSport = 'Cardio Workout';
    if (avgCadence >= 135) {
      inferredSport = 'Running';
    } else if (avgCadence >= 75) {
      inferredSport = 'Outdoor Walk';
    } else if (avgHr >= 140) {
      inferredSport = 'Functional Fitness';
    } else {
      inferredSport = 'Workout';
    }

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
      title: 'Activity Detected',
      message: `${detected.sport}: ${Math.round(durationSec / 60)} min • ${strain.toFixed(1)} Strain. Tap to confirm & save.`,
      priority: 'high',
      actionLabel: 'Confirm',
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
   * Test / diagnostic trigger for UI demonstration
   */
  public triggerTestActivity(sport: string = 'Running', durationMinutes: number = 24): DetectedActivity {
    const now = Date.now();
    const durationSec = durationMinutes * 60;
    const startTime = now - durationSec * 1000;
    const endTime = now;

    const testActivity: DetectedActivity = {
      id: `detected-test-${Date.now()}`,
      sport,
      startTime,
      endTime,
      durationSec,
      avgHr: 148,
      maxHr: 172,
      minHr: 98,
      strain: 10.4,
      calories: 285,
      avgHrv: 58,
      zoneDistribution: { 1: 180, 2: 420, 3: 540, 4: 240, 5: 60 },
      dataPoints: [],
      detectedAt: now,
      cadenceAvg: 145,
    };

    this.pendingActivity = testActivity;
    this.persistPending(testActivity);
    this.notify();
    return testActivity;
  }
}

export const activityDetectionEngine = new ActivityDetectionEngine();
