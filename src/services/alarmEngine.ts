import { whoopBleEngine } from './whoopBleEngine';
import { notificationEngine } from './notificationEngine';
import { hapticAlarm } from '../utils/haptics';
import { localDateKey } from '../utils/dateKey';
import type { LiveMetrics, SleepMetrics } from '../types/whoop';

export type AlarmMode = 'exact_time' | 'sleep_goal' | 'recovery';

export interface AlarmSettings {
  enabled: boolean;
  mode: AlarmMode;
  exactTime: string; // "HH:MM" (24-hour format, e.g. "07:00")
  sleepGoalPercent: number; // 85 | 100
  recoveryThreshold: number; // default 67 (% recovery for Green zone)
  vibrationPattern: 'gentle' | 'pulse' | 'alarm';
  smartWakeWindowMinutes: number; // e.g. 30 min window for light sleep wake-up
  lastTriggeredDate?: string; // YYYY-MM-DD
  lastTriggerReason?: string;
}

const STORAGE_KEY = 'whoop_haptic_alarm_settings';

const DEFAULT_ALARM: AlarmSettings = {
  enabled: false,
  mode: 'exact_time',
  exactTime: '07:00',
  sleepGoalPercent: 100,
  recoveryThreshold: 67,
  vibrationPattern: 'pulse',
  smartWakeWindowMinutes: 30,
};

export class AlarmEngine {
  private settings: AlarmSettings;
  private subscribers = new Set<() => void>();
  private checkInterval: number | null = null;
  private isCurrentlyRinging = false;

  constructor() {
    this.settings = this.loadSettings();

    if (typeof window !== 'undefined') {
      // 10-second background polling timer for time-based alarm evaluation
      this.checkInterval = window.setInterval(() => {
        this.evaluateTimeBasedAlarm();
      }, 10000);
    }
  }

  private loadSettings(): AlarmSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_ALARM, ...JSON.parse(raw) };
      }
    } catch {}
    return { ...DEFAULT_ALARM };
  }

  public getSettings(): AlarmSettings {
    return { ...this.settings };
  }

  public saveSettings(updates: Partial<AlarmSettings>): AlarmSettings {
    this.settings = { ...this.settings, ...updates };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {}
    this.notifySubscribers();
    return this.getSettings();
  }

  public subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((cb) => {
      try {
        cb();
      } catch {}
    });
  }

  public isRinging(): boolean {
    return this.isCurrentlyRinging;
  }

  public stopAlarm(): void {
    this.isCurrentlyRinging = false;
    this.notifySubscribers();
  }

  /**
   * Evaluates time-based alarm condition (Runs every 10s)
   */
  private evaluateTimeBasedAlarm(): void {
    if (!this.settings.enabled || this.settings.mode !== 'exact_time') return;

    const todayStr = localDateKey();
    if (this.settings.lastTriggeredDate === todayStr) return;

    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    if (currentTimeStr === this.settings.exactTime) {
      this.triggerAlarm(`Scheduled Time Alarm reached (${this.settings.exactTime})`);
    }
  }

  /**
   * Evaluates dynamic biometric & sleep alarm conditions
   * Called on every live metric / sleep update
   */
  public evaluateBiometricAlarm(liveMetrics: LiveMetrics, sleepMetrics?: SleepMetrics): void {
    if (!this.settings.enabled) return;

    const todayStr = localDateKey();
    if (this.settings.lastTriggeredDate === todayStr) return;

    // Mode 2: Sleep Goal Alarm (vibrates once Sleep Need is met)
    if (this.settings.mode === 'sleep_goal' && sleepMetrics) {
      const hoursAsleep = sleepMetrics.hoursAsleep ?? 0;
      const need = sleepMetrics.sleepNeedHours || 7.5;
      const pct = (hoursAsleep / need) * 100;

      if (pct >= this.settings.sleepGoalPercent && hoursAsleep > 2.0) {
        this.triggerAlarm(`Sleep Goal reached: ${Math.round(pct)}% of calculated sleep need satisfied.`);
        return;
      }
    }

    // Mode 3: Recovery Alarm (vibrates once Recovery transitions into Green zone)
    if (this.settings.mode === 'recovery') {
      const rec = liveMetrics.recoveryScore;
      if (rec !== null && rec >= this.settings.recoveryThreshold) {
        this.triggerAlarm(`Recovery Target reached: Green Zone autonomic readiness (${rec}%).`);
        return;
      }
    }
  }

  /**
   * Dispatches vibration sequence to physical WHOOP 4.0 strap & device
   */
  public async triggerAlarm(reason: string): Promise<void> {
    const todayStr = localDateKey();
    this.isCurrentlyRinging = true;
    this.saveSettings({
      lastTriggeredDate: todayStr,
      lastTriggerReason: reason,
    });

    console.log(`[ALARM ENGINE] ⏰ WHOOP 4.0 Haptic Alarm Triggered: ${reason}`);

    // 1. Buzz physical WHOOP strap via 3-pulse wake command [0x23, 0x01, 0x01]
    await whoopBleEngine.triggerHapticAlarm();

    // 2. Vibrate phone / browser
    hapticAlarm();

    // 3. Post system notification
    notificationEngine.addNotification({
      type: 'recovery',
      title: 'WHOOP 4.0 Haptic Alarm',
      message: reason,
      priority: 'high',
    });

    this.notifySubscribers();

    // Auto-dismiss ringing state after 45 seconds if not stopped manually
    setTimeout(() => {
      if (this.isCurrentlyRinging) {
        this.stopAlarm();
      }
    }, 45000);
  }

  /**
   * Manual test trigger from UI to test strap motor
   */
  public async testStrapVibration(pattern: 'gentle' | 'pulse' | 'alarm' = this.settings.vibrationPattern): Promise<void> {
    await whoopBleEngine.triggerStrapVibration(pattern);
    hapticAlarm();
  }
}

export const alarmEngine = new AlarmEngine();
