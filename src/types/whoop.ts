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
  heightCm: number;
  maxHr: number;
  restingHrBaseline: number;
  hrvBaseline: number;
  sleepNeedHours: number;
  gender: 'male' | 'female';
  language?: 'en' | 'ar';
  /** true once the user has saved their real profile (age/weight/height/sex). Until then personalised metrics are not computed. */
  profileConfirmed?: boolean;
  /** Target wake time 'HH:MM' for the sleep planner. */
  wakeTime?: string;
}

export interface UserProfile {
  id: string; // unique user identifier, e.g. usr_1792348572
  email: string;
  fullName: string;
  avatarColor?: string;
  pairedDeviceId?: string | null;
  pairedDeviceName?: string | null;
  createdAt: number;
  lastLoginAt: number;
  settings: UserSettings;
}

export interface AuthState {
  currentUser: UserProfile | null;
  profiles: UserProfile[];
  isAuthenticated: boolean;
  isLoading: boolean;
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

export interface SleepStagePoint {
  timestamp: number;
  stage: 'awake' | 'light' | 'deep' | 'rem';
  hr?: number;
}

export interface SleepNeedBreakdown {
  baselineNeedHours: number;
  recentDebtHours: number;
  strainNeedHours: number;
  totalNeedHours: number;
}

export interface SleepMetrics {
  hoursInBed: number | null;
  hoursAsleep: number | null;
  sleepNeedHours: number;
  sleepPerformance: number | null;
  efficiencyPercent: number | null;
  latencyMinutes: number | null;
  disturbancesCount: number | null;
  sleepDebtHours: number;
  needBreakdown?: SleepNeedBreakdown;
  timeline?: SleepStagePoint[];
  stages: {
    awakePercent: number;
    remPercent: number;
    lightPercent: number;
    deepPercent: number;
  };
  bedtime?: string | null;
  wakeTime?: string | null;
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

export interface DailyRecoveryLock {
  date: string;              // YYYY-MM-DD (localDateKey)
  recoveryScore: number;     // 1 - 100% (LOCKED for the day)
  recoveryCategory: 'green' | 'yellow' | 'red' | 'calibrating';
  lockedHrv: number | null;         // Morning / Sleep baseline RMSSD (ms)
  lockedRhr: number | null;         // Morning / Sleep Resting HR (bpm)
  lockedRespiratoryRate: number | null;
  lockedSkinTempCelsius?: number | null;
  lockedSkinTempDelta?: number | null;
  lockedSpO2?: number | null;
  lockedAt: number;          // Timestamp when locked
  source: 'sleep' | 'morning_test' | 'initial_calibration';
}

export interface LiveMetrics {
  currentHr: number | null;
  currentHrv: number | null; // RMSSD in ms (Live Daytime HRV)
  lockedHrv?: number | null; // Morning / Baseline RMSSD locked for today
  lockedRespiratoryRate?: number | null;
  lockedSkinTempCelsius?: number | null;
  lockedSkinTempDelta?: number | null;
  lockedSpO2?: number | null;
  dailyRecoveryLock?: DailyRecoveryLock | null;
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
  hoursAsleep?: number | null;
  hoursInBed?: number | null;
  activeCalories: number;
  bmrCalories: number;
  totalCalories: number;
  steps: number;
  cadence: number; // steps per minute
  stepSource: 'imu_hardware' | 'activity_inference';
  currentZone: 0 | 1 | 2 | 3 | 4 | 5;
  zoneSeconds: Record<number, number>; // seconds spent in zone 0-5
  optimalStrainTarget: { min: number; max: number };
  respiratoryRate: number | null; // breaths/min from RSA
  stressScore: number | null; // 0.0 - 3.0
  stressCategory: 'low' | 'medium' | 'high' | null;
  skinTempCelsius: number | null;
  skinTempDelta: number | null;
  spO2: number | null;
  spO2NightlyAvg: number | null;
  spO2DipsCount: number;
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
  isCharging: boolean;
  chargingStatusText?: string;
  firmwareRevision: string | null;
  hardwareRevision: string | null;
  serialNumber: string | null;
  manufacturerName: string | null;
  modelNumber: string | null;
  connected: boolean;
  connecting: boolean;
  onWrist: boolean | null;
  contactSupported?: boolean;
  contactDetected?: boolean;
  rssi?: number | null;
  packetsPerMinute?: number;
  lastPacketTimestamp?: number | null;
  isSyncing?: boolean;
  syncProgress?: number;
  syncStatusText?: string;
}

export type SessionType = 'workout' | 'sleep';

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
  sleepTimeline?: SleepStagePoint[];
  rhr: number | null;
  hrv: number | null;
  respiratoryRate?: number | null;
  skinTempCelsius?: number | null;
  skinTempDelta?: number | null;
  spO2?: number | null;
  activeCalories: number;
  bmrCalories?: number;
  totalCalories?: number;
  steps?: number;
  zoneSeconds?: Record<number, number>;
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

export interface JournalHabitItem {
  id: string;
  category: 'nutrition' | 'sleep' | 'recovery' | 'lifestyle';
  titleEn: string;
  titleAr: string;
  type: 'boolean' | 'number';
  unit?: string;
  defaultVal: boolean | number;
}

export interface JournalDayEntry {
  date: string; // YYYY-MM-DD
  timestamp: number;
  habits: Record<string, boolean | number>;
  notes?: string;
}

export interface HabitCorrelationStat {
  habitId: string;
  title: string;
  impactPercent: number; // e.g. -14 or +8
  withCount: number;
  withoutCount: number;
  avgRecoveryWith: number;
  avgRecoveryWithout: number;
  status: 'positive' | 'negative' | 'neutral' | 'insufficient_data';
}

// --- Dexie Database Schema Entities ---
export interface UserProfileEntity {
  id: string; // 'current_user'
  name: string;
  age: number;
  gender: 'male' | 'female';
  weightKg: number;
  heightCm: number;
  maxHr: number;
  restingHrBaseline: number;
  hrvBaseline: number;
  sleepNeedHours: number;
  updatedAt: number;
}

export interface RealtimeTelemetryEntity {
  id?: number;
  timestamp: number;
  bpm: number;
  rrIntervals: number[];
  accelMagnitude?: number;
  stress?: number;
  skinTemp?: number;
  spO2?: number;
}

export interface DailyRecordEntity {
  date: string; // primary key: YYYY-MM-DD
  timestamp: number;
  dayStrain: number;
  recoveryScore: number | null;
  recoveryCategory: 'green' | 'yellow' | 'red' | 'calibrating';
  activeCalories: number;
  bmrCalories: number;
  totalCalories: number;
  steps: number;
  cadence: number;
  rhr: number | null;
  hrv: number | null;
  respiratoryRate?: number | null;
  skinTempCelsius?: number | null;
  skinTempDelta: number | null;
  spO2?: number | null;
  spO2Avg: number | null;
  sleepPerformance: number | null;
  hoursAsleep: number | null;
  hoursInBed: number | null;
  sleepNeedHours: number;
  sleepHours?: number | null;
  sleepNeededHours?: number | null;
  deepHours?: number | null;
  remHours?: number | null;
  lightHours?: number | null;
  awakeHours?: number | null;
  sleepEfficiency?: number | null;
  bedtime?: string | null;
  wakeTime?: string | null;
  sleepTimeline?: SleepStagePoint[];
  stressTimeline?: StressPoint[];
  workouts?: SessionRecord[];
  stressAvg: number | null;
  zoneSeconds: Record<number, number>;
}

export type DailyRecord = DailyRecordEntity;

export interface JournalEntryEntity {
  date: string; // primary key: YYYY-MM-DD
  timestamp: number;
  habits: Record<string, boolean | number>;
  notes?: string;
}

export interface WorkoutEntity {
  id: string; // primary key
  sport: string;
  title: string;
  type: SessionType;
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
  notes?: string;
}

