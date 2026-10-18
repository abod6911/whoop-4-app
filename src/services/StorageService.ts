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

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported in this environment'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

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
      const data = localStorage.getItem(SETTINGS_KEY);
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
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed saving user settings', e);
    }
  }

  // --- Real Day State Management (Zero Mock Data) ---
  saveRealDayState(dateStr: string, state: RealDayPersistedState): void {
    try {
      localStorage.setItem(`${REAL_DAY_PREFIX}${dateStr}`, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed saving real day state:', e);
    }
  }

  getRealDayState(dateStr: string): RealDayPersistedState | null {
    try {
      const data = localStorage.getItem(`${REAL_DAY_PREFIX}${dateStr}`);
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
      localStorage.removeItem(`${REAL_DAY_PREFIX}${dateStr}`);
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
        const rawDay = localStorage.getItem(`whoop_day_${dateStr}`);
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

  // List all archived dates from localStorage and Dexie
  getAllArchivedDates(): string[] {
    const datesSet = new Set<string>();
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('whoop_day_')) {
          datesSet.add(key.replace('whoop_day_', ''));
        } else if (key && key.startsWith('whoop_real_day_')) {
          datesSet.add(key.replace('whoop_real_day_', ''));
        }
      }
    }
    return Array.from(datesSet).sort().reverse();
  }

  // --- Sessions Store (Real Workouts, Sleep) ---
  async saveSession(session: SessionRecord): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sessions', 'readwrite');
      const store = tx.objectStore('sessions');
      const req = store.put(session);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
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
      const raw = localStorage.getItem(`whoop_day_${dateStr}`);
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
