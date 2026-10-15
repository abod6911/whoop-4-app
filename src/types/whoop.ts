export type MainTabType = 'home' | 'coaching' | 'activity' | 'strap' | 'more';
export type HomeSubTab = 'overview' | 'strain' | 'recovery' | 'sleep';

export interface HeartRateMeasurement {
  bpm: number;
  rrIntervals: number[]; // in milliseconds
  energyExpended?: number;
  sensorContactSupported?: boolean;
  sensorContactDetected?: boolean;
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
  value: number;
  unit: string;
  status: 'ok' | 'alert';
  typicalRange: string;
  dailyDelta?: string;
  statusText: string;
}

export interface SleepMetrics {
  hoursInBed: number; // e.g. 8.1
  hoursAsleep: number; // e.g. 7.7
  sleepNeedHours: number; // e.g. 7.9
  sleepPerformance: number; // e.g. 98%
  efficiencyPercent: number; // e.g. 95%
  latencyMinutes: number; // e.g. 11m
  disturbancesCount: number; // e.g. 3
  stages: {
    awakePercent: number; // e.g. 8%
    remPercent: number; // e.g. 24%
    lightPercent: number; // e.g. 46%
    deepPercent: number; // e.g. 22%
  };
}

export interface LiveMetrics {
  currentHr: number;
  currentHrv: number; // RMSSD in ms
  sdnn: number;
  meanRR: number;
  minHr: number;
  maxHr: number;
  avgHr: number;
  restingHr: number;
  dailyStrain: number; // 0.0 - 21.0
  recoveryScore: number; // 0 - 100
  recoveryCategory: 'green' | 'yellow' | 'red';
  sleepPerformance: number; // 0 - 100
  activeCalories: number;
  currentZone: 0 | 1 | 2 | 3 | 4 | 5;
  zoneSeconds: Record<number, number>; // seconds spent in zone 0-5
  optimalStrainTarget: { min: number; max: number };
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
  connected: boolean;
  connecting: boolean;
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
