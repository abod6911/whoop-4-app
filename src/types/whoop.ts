export type MainTabType = 'home' | 'plan' | 'community' | 'more' | 'health' | 'strap';
export type HomeSubTab = 'overview' | 'sleep' | 'recovery' | 'strain';

export interface HeartRateMeasurement {
  bpm: number;
  rrIntervals: number[]; // in milliseconds
  isDerivedRR?: boolean;
  energyExpended?: number;
  sensorContactSupported?: boolean;
  sensorContactDetected?: boolean;
  onWrist: boolean | null;
  timestamp: number;
}

export interface UserSettings {
  name: string;
  age: number;
  weightKg: number;
  maxHr: number;
  restingHrBaseline: number;
  hrvBaseline: number;
  sleepNeedHours: number;
  gender: 'male' | 'female';
}

export interface HrZoneInfo {
  zone: 0 | 1 | 2 | 3 | 4 | 5;
  name: string;
  minBpm: number;
  maxBpm: number;
  color: string;
  intensity: string;
}

export interface HealthMonitorMetric {
  key: 'respiratoryRate' | 'bloodOxygen' | 'restingHeartRate' | 'hrv' | 'skinTemp';
  label: string;
  value: number | null;
  unit: string;
  status: 'ok' | 'alert' | 'calibrating';
  typicalRange: string;
  dailyDelta?: string;
  statusText: string;
}

export interface SleepMetrics {
  hoursInBed: number | null;
  hoursAsleep: number | null;
  sleepNeedHours: number;
  sleepPerformance: number | null;
  efficiencyPercent: number | null;
  latencyMinutes: number | null;
  disturbancesCount: number | null;
  stages: {
    awakePercent: number;
    remPercent: number;
    lightPercent: number;
    deepPercent: number;
  };
}

export interface StressPoint {
  timestamp: number;
  timeLabel: string;
  score: number; // 0.0 - 3.0
  category: 'low' | 'medium' | 'high';
}

export interface PoincarePoint {
  rr1: number;
  rr2: number;
  timestamp: number;
}

export interface LiveMetrics {
  currentHr: number | null;
  currentHrv: number | null; // RMSSD in ms
  sdnn: number | null;
  meanRR: number | null;
  lastRR: number | null; // latest beat-to-beat interval in ms
  minHr: number | null;
  maxHr: number | null;
  avgHr: number | null;
  restingHr: number | null;
  dailyStrain: number; // 0.0 - 21.0
  recoveryScore: number | null; // 1 - 100 or null if calibrating
  recoveryCategory: 'green' | 'yellow' | 'red' | 'calibrating';
  sleepPerformance: number | null;
  activeCalories: number;
  currentZone: 0 | 1 | 2 | 3 | 4 | 5;
  zoneSeconds: Record<number, number>; // seconds spent in zone 0-5
  optimalStrainTarget: { min: number; max: number };
  respiratoryRate: number | null; // breaths/min from RSA
  stressScore: number | null; // 0.0 - 3.0
  stressCategory: 'low' | 'medium' | 'high' | null;
  vo2Max: number | null;
  sd1?: number | null;
  sd2?: number | null;
  baevskyIndex?: number | null;
  onWrist: boolean | null;
  timestamp: number;
}

export interface DeviceMetadata {
  name: string;
  id: string;
  batteryLevel: number | null;
  firmwareRevision: string | null;
  hardwareRevision: string | null;
  serialNumber: string | null;
  manufacturerName: string | null;
  modelNumber: string | null;
  connected: boolean;
  connecting: boolean;
  onWrist: boolean | null;
  rssi?: number | null;
}

export type SessionType = 'workout' | 'sleep' | 'recovery_test';

export interface SessionRecord {
  id: string;
  type: SessionType;
  title: string;
  sport?: string;
  startTime: number;
  endTime: number;
  durationSec: number;
  avgHr: number;
  maxHr: number;
  minHr: number;
  strain: number;
  calories: number;
  avgHrv: number;
  recoveryScore?: number;
  zoneDistribution: Record<number, number>;
  dataPoints: Array<{ timestamp: number; hr: number; hrv: number; strain?: number }>;
  notes?: string;
}

export interface DayHistoryRecord {
  offset: number; // 0 = TODAY, 1 = YESTERDAY, etc.
  label: string;
  date: string;
  dayStrain: number;
  recoveryScore: number | null;
  recoveryCategory: 'green' | 'yellow' | 'red' | 'calibrating';
  sleepPerformance: number | null;
  rhr: number | null;
  hrv: number | null;
  activeCalories: number;
  sessions: SessionRecord[];
  stressPoints?: StressPoint[];
  hasRealData: boolean;
}

export interface GattCharacteristicInfo {
  uuid: string;
  serviceUuid: string;
  name: string;
  properties: {
    read: boolean;
    write: boolean;
    writeWithoutResponse: boolean;
    notify: boolean;
    indicate: boolean;
  };
  isNotifying: boolean;
  lastValueHex: string | null;
  lastValueAscii: string | null;
  lastUpdated: number | null;
}

export interface GattServiceInfo {
  uuid: string;
  name: string;
  isPrimary: boolean;
  characteristics: GattCharacteristicInfo[];
}

export interface RawBlePacket {
  id: string;
  timestamp: number;
  serviceUuid: string;
  charUuid: string;
  length: number;
  hex: string;
  ascii: string;
  decimalArray: number[];
}
