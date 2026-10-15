import type { SessionRecord, UserSettings, RawBlePacket } from '../types/whoop';

const DB_NAME = 'WhoopPulseLocalDB';
const DB_VERSION = 1;
const SETTINGS_KEY = 'whoop_user_settings';
const BASELINES_KEY = 'whoop_7day_baselines';

export interface DayBaseline {
  date: string;
  rhr: number;
  hrv: number;
  recoveryScore: number;
  dayStrain: number;
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

        // Live HR samples (recent buffer)
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

  // --- 7-Day Rolling Baselines ---
  get7DayBaselines(): DayBaseline[] {
    try {
      const data = localStorage.getItem(BASELINES_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed reading baselines from localStorage', e);
    }

    // Seed realistic 7-day history if empty
    const now = Date.now();
    const seeded: DayBaseline[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const dayStr = d.toISOString().split('T')[0];
      const rhr = Math.round(50 + (Math.sin(i * 1.5) * 4) + Math.random() * 2);
      const hrv = Math.round(62 + (Math.cos(i * 1.2) * 9) + Math.random() * 4);
      const recovery = Math.min(100, Math.max(25, Math.round(65 + (Math.sin(i * 0.9) * 25))));
      const strain = Number((8.5 + (Math.sin(i * 2.1) * 5.2) + Math.random() * 2).toFixed(1));
      seeded.push({ date: dayStr, rhr, hrv, recoveryScore: recovery, dayStrain: strain });
    }
    this.save7DayBaselines(seeded);
    return seeded;
  }

  save7DayBaselines(baselines: DayBaseline[]): void {
    try {
      localStorage.setItem(BASELINES_KEY, JSON.stringify(baselines));
    } catch (e) {
      console.error('Failed saving 7-day baselines', e);
    }
  }

  updateTodayBaseline(rhr: number, hrv: number, recoveryScore: number, dayStrain: number): void {
    const baselines = this.get7DayBaselines();
    const todayStr = new Date().toISOString().split('T')[0];
    const existingIndex = baselines.findIndex((b) => b.date === todayStr);

    if (existingIndex >= 0) {
      baselines[existingIndex] = {
        date: todayStr,
        rhr: Math.round(rhr),
        hrv: Math.round(hrv),
        recoveryScore: Math.round(recoveryScore),
        dayStrain: Number(dayStrain.toFixed(1)),
      };
    } else {
      baselines.push({
        date: todayStr,
        rhr: Math.round(rhr),
        hrv: Math.round(hrv),
        recoveryScore: Math.round(recoveryScore),
        dayStrain: Number(dayStrain.toFixed(1)),
      });
      if (baselines.length > 14) baselines.shift(); // Keep up to 14 days
    }

    this.save7DayBaselines(baselines);
  }

  // --- Sessions Store (Workouts, Sleep, Tests) ---
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
    a.download = `whoop-${session.type}-${new Date(session.startTime).toISOString().slice(0, 10)}.json`;
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
    a.download = `whoop-${session.type}-${new Date(session.startTime).toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const storageService = new StorageService();
