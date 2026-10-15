export type NotificationType =
  | 'battery'
  | 'ble'
  | 'wrist'
  | 'recovery'
  | 'strain'
  | 'stress'
  | 'sleep'
  | 'system';

export interface WhoopNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionLabel?: string;
  actionType?: 'open_breathe' | 'open_strap' | 'open_journal' | 'open_recovery' | 'dismiss';
}

type NotificationListener = (notifications: WhoopNotification[]) => void;
type ActiveToastListener = (activeToast: WhoopNotification | null) => void;

class NotificationEngine {
  private notifications: WhoopNotification[] = [];
  private activeToast: WhoopNotification | null = null;
  private listeners: Set<NotificationListener> = new Set();
  private toastListeners: Set<ActiveToastListener> = new Set();
  private toastTimeout: number | null = null;

  // Audio Context for synthetic athletic chimes
  private audioCtx: AudioContext | null = null;

  // Cooldown / throttle flags
  private lastBatteryAlertTime = 0;
  private lastBatteryAlertLevel: number | null = null;
  private lastStressAlertTime = 0;
  private optimalStrainAlertFiredToday = false;
  private lastWristStatus: boolean | null = null;
  private lastConnectionState: boolean | null = null;

  constructor() {
    this.loadHistory();
  }

  private loadHistory(): void {
    try {
      const saved = localStorage.getItem('whoop_notifications_v1');
      if (saved) {
        this.notifications = JSON.parse(saved);
      }
    } catch {
      this.notifications = [];
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem('whoop_notifications_v1', JSON.stringify(this.notifications.slice(0, 50)));
    } catch {
      // Ignore storage error
    }
    this.notifyListeners();
  }

  public subscribe(cb: NotificationListener): () => void {
    this.listeners.add(cb);
    cb(this.getNotifications());
    return () => this.listeners.delete(cb);
  }

  public subscribeToast(cb: ActiveToastListener): () => void {
    this.toastListeners.add(cb);
    cb(this.activeToast);
    return () => this.toastListeners.delete(cb);
  }

  private notifyListeners(): void {
    const list = this.getNotifications();
    this.listeners.forEach((cb) => cb(list));
  }

  private notifyToastListeners(): void {
    this.toastListeners.forEach((cb) => cb(this.activeToast));
  }

  public getNotifications(): WhoopNotification[] {
    return [...this.notifications];
  }

  public getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  public markAllAsRead(): void {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
    this.saveHistory();
  }

  public markAsRead(id: string): void {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    this.saveHistory();
  }

  public clearAll(): void {
    this.notifications = [];
    this.saveHistory();
  }

  public dismissToast(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
    this.activeToast = null;
    this.notifyToastListeners();
  }

  // --- Sound & Haptic Generation ---
  private playAthleticChime(type: NotificationType): void {
    try {
      if (typeof window === 'undefined') return;
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'battery' || type === 'stress') {
        // High attention gentle double tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'recovery' || type === 'strain') {
        // Upbeat harmonic chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else {
        // Standard subtle cue
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {
      // Audio autoplay policy catch
    }

    // Haptics
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        if (type === 'battery' || type === 'stress') {
          navigator.vibrate([60, 40, 80]);
        } else {
          navigator.vibrate([40, 40]);
        }
      }
    } catch {
      // Ignore
    }
  }

  // --- Push Permission Request ---
  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const res = await Notification.requestPermission();
      return res === 'granted';
    } catch {
      return false;
    }
  }

  public isPermissionGranted(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    return Notification.permission === 'granted';
  }

  // --- Dispatch Notification ---
  public dispatch(notification: Omit<WhoopNotification, 'id' | 'timestamp' | 'read'>): WhoopNotification {
    const item: WhoopNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      read: false,
      ...notification,
    };

    // Prepend to history
    this.notifications.unshift(item);
    if (this.notifications.length > 50) this.notifications.pop();
    this.saveHistory();

    // Trigger in-app Dynamic Island Toast
    this.activeToast = item;
    this.notifyToastListeners();

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = window.setTimeout(() => {
      this.activeToast = null;
      this.notifyToastListeners();
    }, 6000);

    // Audio & Haptic chime
    this.playAthleticChime(item.type);

    // Native Browser Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(item.title, {
          body: item.message,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: item.type,
        });
      } catch {
        // Fallback gracefully
      }
    }

    return item;
  }

  // ==========================================
  // REAL-TIME AUTOMATED TRIGGERS
  // ==========================================

  /**
   * 1. Low Battery Critical Alert (<= 15% or <= 10%)
   */
  public checkBattery(batteryLevel: number | null): void {
    if (batteryLevel === null) return;
    const now = Date.now();

    if (batteryLevel <= 15) {
      // Alert if battery level dropped further or if 30 mins have elapsed
      const levelDiff = this.lastBatteryAlertLevel === null || batteryLevel < this.lastBatteryAlertLevel;
      const timeElapsed = now - this.lastBatteryAlertTime > 1800000;

      if (levelDiff || timeElapsed) {
        this.lastBatteryAlertTime = now;
        this.lastBatteryAlertLevel = batteryLevel;

        this.dispatch({
          type: 'battery',
          title: `🔋 Battery Critical (${batteryLevel}%)`,
          message: `Slide on your WHOOP 4.0 wireless battery pack soon to prevent telemetry interruption.`,
          actionLabel: 'Check Strap',
          actionType: 'open_strap',
        });
      }
    } else {
      this.lastBatteryAlertLevel = batteryLevel;
    }
  }

  /**
   * 2. BLE Connection & Wrist Contact Status Alert
   */
  public checkBleState(connected: boolean, onWrist: boolean | null): void {
    // Connection State Change
    if (this.lastConnectionState !== null && this.lastConnectionState !== connected) {
      if (connected) {
        this.dispatch({
          type: 'ble',
          title: 'WHOOP 4.0 Connected',
          message: 'Real-time telemetry and optical sensor data stream active.',
          actionLabel: 'View Telemetry',
          actionType: 'open_strap',
        });
      } else {
        this.dispatch({
          type: 'ble',
          title: 'WHOOP 4.0 Disconnected',
          message: 'Strap disconnected. Ensure device is within BLE range.',
          actionLabel: 'Reconnect',
          actionType: 'open_strap',
        });
      }
    }
    this.lastConnectionState = connected;

    // Wrist Contact Status Change
    if (connected && onWrist !== null && this.lastWristStatus !== null && this.lastWristStatus !== onWrist) {
      if (onWrist) {
        this.dispatch({
          type: 'wrist',
          title: 'WHOOP On Wrist',
          message: 'Optical PPG sensors locked on skin. Recording live biometrics.',
        });
      } else {
        this.dispatch({
          type: 'wrist',
          title: 'WHOOP Off Wrist',
          message: 'Sensor contact lost. Strap is removed from wrist.',
        });
      }
    }
    if (connected && onWrist !== null) {
      this.lastWristStatus = onWrist;
    }
  }

  /**
   * 3. Morning Recovery Ready Alert
   */
  public triggerRecoveryReady(score: number, targetStrainMin: number, targetStrainMax: number): void {
    const icon = score >= 67 ? '🟢' : score >= 34 ? '🟡' : '🔴';
    this.dispatch({
      type: 'recovery',
      title: `${icon} ${score}% Recovery Calculated`,
      message: `Your autonomic nervous system is calibrated. Optimal Day Strain target: ${targetStrainMin.toFixed(1)} - ${targetStrainMax.toFixed(1)}.`,
      actionLabel: 'View Recovery',
      actionType: 'open_recovery',
    });
  }

  /**
   * 4. Optimal Strain Target Reached Alert
   */
  public checkStrainTarget(currentStrain: number, targetMin: number): void {
    if (!this.optimalStrainAlertFiredToday && currentStrain >= targetMin && targetMin > 0) {
      this.optimalStrainAlertFiredToday = true;
      this.dispatch({
        type: 'strain',
        title: '🎯 Optimal Strain Target Reached!',
        message: `Day Strain hit ${currentStrain.toFixed(1)}, reaching your optimal stimulus range.`,
        actionLabel: 'View Details',
        actionType: 'open_journal',
      });
    }
  }

  /**
   * 5. High Resting Stress Alert (> 2.2 / 3.0)
   */
  public checkHighStress(stressScore: number | null, isWorkoutActive: boolean): void {
    if (stressScore === null || isWorkoutActive) return;
    const now = Date.now();

    // Trigger only if score >= 2.0 (High Stress range) and at least 15 minutes since last alert
    if (stressScore >= 2.0 && now - this.lastStressAlertTime > 900000) {
      this.lastStressAlertTime = now;
      this.dispatch({
        type: 'stress',
        title: `⚡ High Resting Stress Detected (${stressScore.toFixed(1)} / 3.0)`,
        message: `Your sympathetic arousal is elevated while stationary. Start a 2-minute biofeedback session to restore autonomic balance.`,
        actionLabel: 'Start Breathe',
        actionType: 'open_breathe',
      });
    }
  }

  /**
   * 6. Sleep Planner Bedtime Reminder
   */
  public triggerBedtimeReminder(targetBedtimeStr: string): void {
    this.dispatch({
      type: 'sleep',
      title: '🌙 Target Bedtime in 30 Minutes',
      message: `Wind down now to achieve your optimal sleep performance goal by ${targetBedtimeStr}.`,
      actionLabel: 'Open Sleep Lock',
      actionType: 'open_journal',
    });
  }

  /**
   * 7. Trigger a Manual Test Alert
   */
  public triggerTestNotification(): void {
    this.dispatch({
      type: 'system',
      title: 'WHOOP System Test',
      message: 'Dynamic Island, athletic audio chimes, and haptic engine are active and working.',
    });
  }
}

export const notificationEngine = new NotificationEngine();
