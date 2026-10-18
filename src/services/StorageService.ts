import type { SessionRecord, UserSettings, RawBlePacket, DayHistoryRecord, StressPoint } from '../types/whoop';
import { localDateKey } from '../utils/dateKey';

const DB_NAME = 'WhoopPulseLocalDB';
const DB_VERSION = 2;
const SETTINGS_KEY = 'whoop_user_settings';
const REAL_DAY_PREFIX = 'whoop_real_day_';

export interface RealDayPersistedState {
  date?: string;
  dayStrain: number;
  activeCalories: number;
  bmrCalories?: number;
  totalCalories?: number;
  steps?: number;
  rhr: number | null;
  hrv: number | null;
  respiratoryRate?: number | null;
  skinTempCelsius?: number | null;
  skinTempDelta?: number | null;
  spO2?: number | null;
  recoveryScore: number | null;
  recoveryCategory: 'green' | 'yellow' | 'red' | 'calibrating';
  zoneSeconds: Record<number, number>;
  stressPoints?: StressPoint[];
  sleepPerformance?: number | null;
  hoursAsleep?: number | null;
  hoursInBed?: number | null;
  sleepNeedHours?: number | null;
  sleepHours?: number | null;
  sleepNeededHours?: number | null;
  deepHours?: number | null;
  remHours?: number | null;
  lightHours?: number | null;
  awakeHours?: number | null;
  sleepEfficiency?: number | null;
  bedtime?: string | null;
  wakeTime?: string | null;
  sleepTimeline?: any[];
  workouts?: SessionRecord[];
}

export const DEFAULT_SETTINGS: UserSettings = {
  name: 'Athlete',
  age: 28,
  weightKg: 75,
  heightCm: 178,
  maxHr: 192,
  restingHrBaseline: 52,
  hrvBaseline: 65,
  sleepNeedHours: 7.9,
  gender: 'male',
  language: 'ar',
};

export function purgeLegacyMockStorage(): void {
  if (typeof localStorage === 'undefined') return;

  try {
    // 1. Remove cached fake battery
    localStorage.removeItem('whoop_last_battery_level');

    // 2. Scan and clean all localStorage keys for legacy mock values
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Clean whoop_steps_*
      if (key.startsWith('whoop_steps_')) {
        try {
          const val = localStorage.getItem(key);
          if (val) {
            const parsed = JSON.parse(val);
            if (parsed && (parsed.steps === 1245 || parsed.source === 'activity_inference')) {
              parsed.steps = 0;
              parsed.source = 'imu_hardware';
              localStorage.setItem(key, JSON.stringify(parsed));
            }
          }
        } catch {}
      }

      // Remove synthetic recovery locks
      if (key.startsWith('whoop_daily_recovery_lock_') || key.startsWith('whoop_recovery_lock_')) {
        try {
          const val = localStorage.getItem(key);
          if (val) {
            const p = JSON.parse(val);
            const score = p.recoveryScore ?? p.lockedRecoveryScore;
            if (score === 51 || score === 78 || p.source === 'initial_calibration') {
              keysToRemove.push(key);
            }
          }
        } catch {}
      }

      // Clean whoop_day_* and whoop_real_day_*
      if (key.startsWith('whoop_day_') || key.startsWith('whoop_real_day_')) {
        try {
          const val = localStorage.getItem(key);
          if (val) {
            const d = JSON.parse(val);
            let changed = false;
            if (d.steps === 1245) {
              d.steps = 0;
              changed = true;
            }
            if (d.recoveryScore === 51 || d.recoveryScore === 78) {
              d.recoveryScore = null;
              d.recoveryCategory = 'calibrating';
              changed = true;
            }
            if (d.hrv === 65 && (!d.workouts || d.workouts.length === 0)) {
              d.hrv = null;
              changed = true;
            }
            if (d.rhr === 52 && (!d.workouts || d.workouts.length === 0)) {
              d.rhr = null;
              changed = true;
            }
            if (changed) {
              localStorage.setItem(key, JSON.stringify(d));
            }
          }
        } catch {}
      }
    }

    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // 3. Clear fake streak if no physical strap was ever connected
    const activeDaysRaw = localStorage.getItem('whoop_active_wear_days');
    if (activeDaysRaw) {
      try {
        const lastStrap = localStorage.getItem('whoop_last_paired_serial');
        if (!lastStrap) {
          localStorage.removeItem('whoop_active_wear_days');
          localStorage.removeItem('whoop_longest_streak');
        }
      } catch {}
    }
  } catch (e) {
    console.warn('[Storage] purgeLegacyMockStorage error:', e);
  }
}

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private activeUserId: string | null = null;

  constructor() {
    // Purge any legacy fake metrics from earlier versions
    purgeLegacyMockStorage();

    // Try to load active user from localStorage if already logged in
    if (typeof localStorage !== 'undefined') {
      const storedId = localStorage.getItem('whoop_active_user_id');
      if (storedId) this.activeUserId = storedId;
    }
    this.initDB();
  }

  public setUserId(userId: string | null): void {
    if (this.activeUserId !== userId) {
      this.activeUserId = userId;
      this.dbPromise = null;
      this.initDB();
    }
  }

  public getUserId(): string | null {
    return this.activeUserId;
  }

  private getSettingsKey(): string {
    return this.activeUserId ? `user_${this.activeUserId}_settings` : SETTINGS_KEY;
  }

  private getRealDayKey(dateStr: string): string {
    return this.activeUserId ? `user_${this.activeUserId}_real_day_${dateStr}` : `${REAL_DAY_PREFIX}${dateStr}`;
  }

  private getDayKey(dateStr: string): string {
    return this.activeUserId ? `user_${this.activeUserId}_day_${dateStr}` : `whoop_day_${dateStr}`;
  }

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported in this environment'));
        return;
      }

      const dbName = this.activeUserId ? `WhoopPulseDB_${this.activeUserId}` : DB_NAME;
      const request = indexedDB.open(dbName, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('type', 'type', { unique: false });
          sessionStore.createIndex('startTime', 'startTime', { unique: false });
        }

        // Live HR samples
        if (!db.objectStoreNames.contains('hr_samples')) {
          const hrStore = db.createObjectStore('hr_samples', { keyPath: 'id', autoIncrement: true });
          hrStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // BLE Sniffer raw packets
        if (!db.objectStoreNames.contains('raw_packets')) {
          const packetStore = db.createObjectStore('raw_packets', { keyPath: 'id' });
          packetStore.createIndex('timestamp', 'timestamp', { unique: false });
          packetStore.createIndex('charUuid', 'charUuid', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.dbPromise;
  }

  // --- User Settings ---
  getUserSettings(): UserSettings {
    try {
      const data = localStorage.getItem(this.getSettingsKey());
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Failed reading user settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  }

  saveUserSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(this.getSettingsKey(), JSON.stringify(settings));
    } catch (e) {
      console.error('Failed saving user settings', e);
    }
  }

  // --- Real Day State Management (Zero Mock Data) ---
  saveRealDayState(dateStr: string, state: RealDayPersistedState): void {
    try {
      localStorage.setItem(this.getRealDayKey(dateStr), JSON.stringify(state));
    } catch (e) {
      console.warn('Failed saving real day state:', e);
    }
  }

  getRealDayState(dateStr: string): RealDayPersistedState | null {
    try {
      const data = localStorage.getItem(this.getRealDayKey(dateStr));
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed reading real day state:', e);
    }
    return null;
  }

  clearRealDayState(dateStr: string): void {
    try {
      localStorage.removeItem(this.getRealDayKey(dateStr));
    } catch (e) {
      console.warn('Failed clearing real day state:', e);
    }
  }

  // --- Full History from Real Stored Records (Up to 60 Days) ---
  getDaysHistory(numDays = 30): DayHistoryRecord[] {
    const records: DayHistoryRecord[] = [];
    const now = Date.now();

    for (let offset = 0; offset < numDays; offset++) {
      const targetTime = now - offset * 86400000;
      const dateStr = localDateKey(targetTime);
      let saved = this.getRealDayState(dateStr);

      try {
        const rawDay = localStorage.getItem(this.getDayKey(dateStr));
        if (rawDay) {
          const parsed = JSON.parse(rawDay);
          saved = { ...(saved || {}), ...parsed };
        }
      } catch {}

      let label = 'TODAY';
      if (offset === 1) label = 'YESTERDAY';
      else if (offset > 1) label = `${offset} DAYS AGO`;

      if (saved && (saved.dayStrain > 0 || saved.recoveryScore !== null || (saved.activeCalories && saved.activeCalories > 0) || saved.sleepPerformance !== null || saved.hoursAsleep !== null)) {
        records.push({
          offset,
          label,
          date: dateStr,
          dayStrain: saved.dayStrain || 0,
          recoveryScore: saved.recoveryScore || null,
          recoveryCategory: saved.recoveryCategory || 'calibrating',
          sleepPerformance: saved.sleepPerformance ?? null,
          hoursAsleep: saved.hoursAsleep ?? saved.sleepHours ?? null,
          hoursInBed: saved.hoursInBed ?? null,
          sleepNeedHours: saved.sleepNeedHours ?? saved.sleepNeededHours ?? null,
          sleepHours: saved.sleepHours ?? saved.hoursAsleep ?? null,
          sleepNeededHours: saved.sleepNeededHours ?? saved.sleepNeedHours ?? null,
          deepHours: saved.deepHours ?? null,
          remHours: saved.remHours ?? null,
          lightHours: saved.lightHours ?? null,
          awakeHours: saved.awakeHours ?? null,
          sleepEfficiency: saved.sleepEfficiency ?? null,
          bedtime: saved.bedtime ?? null,
          wakeTime: saved.wakeTime ?? null,
          sleepTimeline: saved.sleepTimeline || [],
          rhr: saved.rhr || null,
          hrv: saved.hrv || null,
          respiratoryRate: saved.respiratoryRate ?? null,
          skinTempCelsius: saved.skinTempCelsius ?? null,
          skinTempDelta: saved.skinTempDelta ?? null,
          spO2: saved.spO2 ?? null,
          activeCalories: saved.activeCalories || 0,
          bmrCalories: saved.bmrCalories,
          totalCalories: saved.totalCalories || ((saved.bmrCalories || 0) + (saved.activeCalories || 0)),
          steps: saved.steps || 0,
          zoneSeconds: saved.zoneSeconds || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          sessions: saved.workouts || [],
          stressPoints: saved.stressPoints || [],
          hasRealData: true,
        });
      } else {
        records.push({
          offset,
          label,
          date: dateStr,
          dayStrain: 0,
          recoveryScore: null,
          recoveryCategory: 'calibrating',
          sleepPerformance: null,
          hoursAsleep: null,
          hoursInBed: null,
          sleepNeedHours: null,
          sleepHours: null,
          sleepNeededHours: null,
          deepHours: null,
          remHours: null,
          lightHours: null,
          awakeHours: null,
          sleepEfficiency: null,
          bedtime: null,
          wakeTime: null,
          sleepTimeline: [],
          rhr: null,
          hrv: null,
          respiratoryRate: null,
          skinTempCelsius: null,
          skinTempDelta: null,
          spO2: null,
          activeCalories: 0,
          bmrCalories: 0,
          totalCalories: 0,
          steps: 0,
          zoneSeconds: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          sessions: [],
          stressPoints: [],
          hasRealData: false,
        });
      }
    }

    return records;
  }

  // List all archived dates from localStorage and Dexie for active user
  getAllArchivedDates(): string[] {
    const datesSet = new Set<string>();
    const prefix1 = this.activeUserId ? `user_${this.activeUserId}_day_` : 'whoop_day_';
    const prefix2 = this.activeUserId ? `user_${this.activeUserId}_real_day_` : 'whoop_real_day_';
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix1)) {
          datesSet.add(key.replace(prefix1, ''));
        } else if (key && key.startsWith(prefix2)) {
          datesSet.add(key.replace(prefix2, ''));
        }
      }
    }
    return Array.from(datesSet).sort().reverse();
  }

  // --- Sessions Store (Real Workouts, Sleep) ---
  async saveSession(session: SessionRecord): Promise<void> {
    const db = await this.initDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('sessions', 'readwrite');
      const store = tx.objectStore('sessions');
      const req = store.put(session);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    try {
      const dateStr = localDateKey(session.startTime);
      const realDay = this.getRealDayState(dateStr);
      if (realDay) {
        const workouts = Array.isArray(realDay.workouts)
          ? realDay.workouts.filter((w) => w.id !== session.id)
          : [];
        workouts.unshift(session);
        this.saveRealDayState(dateStr, { ...realDay, workouts });
      }
      const rawDay = localStorage.getItem(this.getDayKey(dateStr));
      if (rawDay) {
        const parsed = JSON.parse(rawDay);
        const wList = Array.isArray(parsed.workouts)
          ? parsed.workouts.filter((w: any) => w.id !== session.id)
          : [];
        wList.unshift(session);
        localStorage.setItem(this.getDayKey(dateStr), JSON.stringify({ ...parsed, workouts: wList }));
      }
    } catch {}
  }

  async getAllSessions(): Promise<SessionRecord[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sessions', 'readonly');
      const store = tx.objectStore('sessions');
      const req = store.getAll();
      req.onsuccess = () => {
        const sorted = (req.result as SessionRecord[]).sort((a, b) => b.startTime - a.startTime);
        resolve(sorted);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getSessionsForDay(dateStr: string): Promise<SessionRecord[]> {
    const all = await this.getAllSessions();
    return all.filter((s) => {
      const d = localDateKey(s.startTime);
      return d === dateStr;
    });
  }

  getWorkoutsForDate(dateStr: string): SessionRecord[] {
    try {
      const raw = localStorage.getItem(this.getDayKey(dateStr));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.workouts)) return parsed.workouts;
      }
    } catch {}
    return [];
  }

  async deleteSession(id: string): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sessions', 'readwrite');
      const store = tx.objectStore('sessions');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Raw BLE Packets Sniffer Store ---
  async saveRawPacket(packet: RawBlePacket): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('raw_packets', 'readwrite');
      const store = tx.objectStore('raw_packets');
      const req = store.put(packet);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getRecentRawPackets(limit = 100): Promise<RawBlePacket[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('raw_packets', 'readonly');
      const store = tx.objectStore('raw_packets');
      const req = store.getAll();
      req.onsuccess = () => {
        const sorted = (req.result as RawBlePacket[])
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit);
        resolve(sorted);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async clearRawPackets(): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('raw_packets', 'readwrite');
      const store = tx.objectStore('raw_packets');
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Export Utilities ---
  exportSessionToJSON(session: SessionRecord): void {
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whoop-session-${new Date(session.startTime).toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportSessionToCSV(session: SessionRecord): void {
    let csv = 'Timestamp,ISO_Time,HeartRate_BPM,HRV_RMSSD_ms,CurrentStrain\n';
    session.dataPoints.forEach((pt) => {
      const iso = new Date(pt.timestamp).toISOString();
      csv += `${pt.timestamp},${iso},${pt.hr},${pt.hrv || ''},${pt.strain || ''}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whoop-session-${new Date(session.startTime).toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const storageService = new StorageService();
