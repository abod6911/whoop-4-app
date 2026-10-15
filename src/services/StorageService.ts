import type { SessionRecord, UserSettings, RawBlePacket, DayHistoryRecord, StressPoint } from '../types/whoop';

const DB_NAME = 'WhoopPulseLocalDB';
const DB_VERSION = 2;
const SETTINGS_KEY = 'whoop_user_settings';
const REAL_DAY_PREFIX = 'whoop_real_day_';

export interface RealDayPersistedState {
  dayStrain: number;
  activeCalories: number;
  rhr: number | null;
  hrv: number | null;
  recoveryScore: number | null;
  recoveryCategory: 'green' | 'yellow' | 'red' | 'calibrating';
  zoneSeconds: Record<number, number>;
  stressPoints?: StressPoint[];
}

export const DEFAULT_SETTINGS: UserSettings = {
  name: 'Athlete',
  age: 28,
  weightKg: 75,
  maxHr: 192,
  restingHrBaseline: 52,
  hrvBaseline: 65,
  sleepNeedHours: 7.9,
  gender: 'male',
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

  // --- 7-Day History from Real Stored Records ---
  getDaysHistory(): DayHistoryRecord[] {
    const records: DayHistoryRecord[] = [];
    const now = Date.now();

    for (let offset = 0; offset < 7; offset++) {
      const targetTime = now - offset * 86400000;
      const dateStr = new Date(targetTime).toISOString().slice(0, 10);
      const saved = this.getRealDayState(dateStr);

      let label = 'TODAY';
      if (offset === 1) label = 'YESTERDAY';
      else if (offset > 1) label = `${offset} DAYS AGO`;

      if (saved) {
        records.push({
          offset,
          label,
          date: dateStr,
          dayStrain: saved.dayStrain || 0,
          recoveryScore: saved.recoveryScore || null,
          recoveryCategory: saved.recoveryCategory || 'calibrating',
          sleepPerformance: null,
          rhr: saved.rhr || null,
          hrv: saved.hrv || null,
          activeCalories: saved.activeCalories || 0,
          sessions: [],
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
          rhr: null,
          hrv: null,
          activeCalories: 0,
          sessions: [],
          stressPoints: [],
          hasRealData: false,
        });
      }
    }

    return records;
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
      const d = new Date(s.startTime).toISOString().slice(0, 10);
      return d === dateStr;
    });
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
