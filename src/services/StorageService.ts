import type { SessionRecord, UserSettings, RawBlePacket } from '../types/whoop';

const DB_NAME = 'WhoopPulseLocalDB';
const DB_VERSION = 1;
const SETTINGS_KEY = 'whoop_user_settings';
const BASELINES_KEY = 'whoop_7day_baselines';
const DAYS_HISTORY_KEY = 'whoop_days_history';

export interface DayBaseline {
  date: string;
  rhr: number;
  hrv: number;
  recoveryScore: number;
  dayStrain: number;
}

export interface DayHistoryRecord {
  offset: number; // 0 = TODAY, 1 = YESTERDAY, 2 = 2 DAYS AGO, etc.
  label: string;
  date: string;
  dayStrain: number;
  recoveryScore: number;
  recoveryCategory: 'green' | 'yellow' | 'red';
  sleepPerformance: number;
  rhr: number;
  hrv: number;
  activeCalories: number;
  sessions: SessionRecord[];
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

  // --- 7-Day History for Carousel Navigation ---
  getDaysHistory(): DayHistoryRecord[] {
    try {
      const data = localStorage.getItem(DAYS_HISTORY_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed reading days history from localStorage', e);
    }

    // Default realistic 7 days matching WHOOP's exact patterns
    const now = Date.now();
    const seeded: DayHistoryRecord[] = [
      {
        offset: 0,
        label: 'TODAY',
        date: new Date(now).toISOString().slice(0, 10),
        dayStrain: 6.8,
        recoveryScore: 78,
        recoveryCategory: 'green',
        sleepPerformance: 98,
        rhr: 52,
        hrv: 68,
        activeCalories: 215,
        sessions: [
          {
            id: 'mock-workout-today',
            type: 'workout',
            title: 'Morning Interval Run',
            sport: 'Running',
            startTime: now - 3600000 * 3,
            endTime: now - 3600000 * 2.3,
            durationSec: 2520,
            avgHr: 148,
            maxHr: 174,
            minHr: 110,
            strain: 9.2,
            calories: 340,
            avgHrv: 62,
            zoneDistribution: { 1: 300, 2: 720, 3: 900, 4: 480, 5: 120 },
            dataPoints: [],
          },
        ],
      },
      {
        offset: 1,
        label: 'YESTERDAY',
        date: new Date(now - 86400000).toISOString().slice(0, 10),
        dayStrain: 14.6,
        recoveryScore: 84,
        recoveryCategory: 'green',
        sleepPerformance: 92,
        rhr: 50,
        hrv: 72,
        activeCalories: 560,
        sessions: [
          {
            id: 'mock-workout-yest-1',
            type: 'workout',
            title: 'Heavy Squats & Deadlifts',
            sport: 'Weightlifting',
            startTime: now - 86400000 - 3600000 * 5,
            endTime: now - 86400000 - 3600000 * 4,
            durationSec: 3600,
            avgHr: 138,
            maxHr: 168,
            minHr: 95,
            strain: 11.8,
            calories: 420,
            avgHrv: 66,
            zoneDistribution: { 1: 600, 2: 1200, 3: 1200, 4: 600, 5: 0 },
            dataPoints: [],
          },
        ],
      },
      {
        offset: 2,
        label: '2 DAYS AGO',
        date: new Date(now - 86400000 * 2).toISOString().slice(0, 10),
        dayStrain: 8.4,
        recoveryScore: 61,
        recoveryCategory: 'yellow',
        sleepPerformance: 85,
        rhr: 53,
        hrv: 62,
        activeCalories: 310,
        sessions: [],
      },
      {
        offset: 3,
        label: '3 DAYS AGO',
        date: new Date(now - 86400000 * 3).toISOString().slice(0, 10),
        dayStrain: 16.2,
        recoveryScore: 54,
        recoveryCategory: 'yellow',
        sleepPerformance: 78,
        rhr: 54,
        hrv: 58,
        activeCalories: 680,
        sessions: [
          {
            id: 'mock-workout-3d',
            type: 'workout',
            title: 'Outdoor Road Cycling',
            sport: 'Cycling',
            startTime: now - 86400000 * 3 - 3600000 * 4,
            endTime: now - 86400000 * 3 - 3600000 * 2,
            durationSec: 7200,
            avgHr: 142,
            maxHr: 169,
            minHr: 105,
            strain: 15.1,
            calories: 780,
            avgHrv: 55,
            zoneDistribution: { 1: 900, 2: 2400, 3: 2700, 4: 1200, 5: 0 },
            dataPoints: [],
          },
        ],
      },
      {
        offset: 4,
        label: '4 DAYS AGO',
        date: new Date(now - 86400000 * 4).toISOString().slice(0, 10),
        dayStrain: 5.1,
        recoveryScore: 31,
        recoveryCategory: 'red',
        sleepPerformance: 64,
        rhr: 58,
        hrv: 44,
        activeCalories: 180,
        sessions: [],
      },
      {
        offset: 5,
        label: '5 DAYS AGO',
        date: new Date(now - 86400000 * 5).toISOString().slice(0, 10),
        dayStrain: 12.3,
        recoveryScore: 68,
        recoveryCategory: 'green',
        sleepPerformance: 89,
        rhr: 51,
        hrv: 69,
        activeCalories: 450,
        sessions: [],
      },
      {
        offset: 6,
        label: '6 DAYS AGO',
        date: new Date(now - 86400000 * 6).toISOString().slice(0, 10),
        dayStrain: 9.8,
        recoveryScore: 75,
        recoveryCategory: 'green',
        sleepPerformance: 91,
        rhr: 52,
        hrv: 67,
        activeCalories: 380,
        sessions: [],
      },
    ];

    this.saveDaysHistory(seeded);
    return seeded;
  }

  saveDaysHistory(days: DayHistoryRecord[]): void {
    try {
      localStorage.setItem(DAYS_HISTORY_KEY, JSON.stringify(days));
    } catch (e) {
      console.error('Failed saving days history', e);
    }
  }

  addWorkoutToToday(workout: SessionRecord): void {
    const days = this.getDaysHistory();
    const today = days[0];
    if (today) {
      today.sessions.unshift(workout);
      // Increase today strain logarithmically
      const currentTrimp = -70 * Math.log(Math.max(0.001, 1 - today.dayStrain / 21));
      const addedTrimp = -70 * Math.log(Math.max(0.001, 1 - workout.strain / 21));
      const newTrimp = currentTrimp + addedTrimp;
      const newStrain = 21 * (1 - Math.exp(-newTrimp / 70));
      today.dayStrain = Number(Math.min(21, Math.max(today.dayStrain, newStrain)).toFixed(1));
      today.activeCalories += workout.calories;
      this.saveDaysHistory(days);
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

    const days = this.getDaysHistory();
    const baselines: DayBaseline[] = days.map((d) => ({
      date: d.date,
      rhr: d.rhr,
      hrv: d.hrv,
      recoveryScore: d.recoveryScore,
      dayStrain: d.dayStrain,
    }));

    this.save7DayBaselines(baselines);
    return baselines;
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
      baselines.unshift({
        date: todayStr,
        rhr: Math.round(rhr),
        hrv: Math.round(hrv),
        recoveryScore: Math.round(recoveryScore),
        dayStrain: Number(dayStrain.toFixed(1)),
      });
      if (baselines.length > 14) baselines.pop();
    }

    this.save7DayBaselines(baselines);

    // Also sync to DayHistoryRecord[0]
    const days = this.getDaysHistory();
    if (days[0]) {
      days[0].rhr = Math.round(rhr);
      days[0].hrv = Math.round(hrv);
      days[0].recoveryScore = Math.round(recoveryScore);
      days[0].recoveryCategory = recoveryScore >= 67 ? 'green' : recoveryScore <= 33 ? 'red' : 'yellow';
      days[0].dayStrain = Number(dayStrain.toFixed(1));
      this.saveDaysHistory(days);
    }
  }

  // --- Sessions Store (Workouts, Sleep, Tests) ---
  async saveSession(session: SessionRecord): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sessions', 'readwrite');
      const store = tx.objectStore('sessions');
      const req = store.put(session);
      req.onsuccess = () => {
        this.addWorkoutToToday(session);
        resolve();
      };
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
