import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  DeviceMetadata,
  LiveMetrics,
  SessionRecord,
  GattServiceInfo,
  RawBlePacket,
  UserSettings,
  MainTabType,
  HomeSubTab,
  HealthMonitorMetric,
  SleepMetrics,
  DayHistoryRecord,
} from './types/whoop';
import { whoopBleEngine } from './services/whoopBleEngine';
import { biometricEngine } from './utils/biometricEngine';
import { storageService } from './services/StorageService';
import {
  generateHealthMonitorMetrics,
  generateSleepMetrics,
  calculateOptimalStrainTarget,
} from './utils/whoopAlgorithms';
import { localDateKey } from './utils/dateKey';

import { WhoopTopBar } from './components/WhoopTopBar';
import { WhoopBottomNav } from './components/WhoopBottomNav';
import { OverviewView } from './components/views/OverviewView';
import { PlanView } from './components/views/PlanView';
import { CommunityView } from './components/views/CommunityView';
import { StrainView } from './components/views/StrainView';
import { RecoveryView } from './components/views/RecoveryView';
import { SleepView } from './components/views/SleepView';
import { StrapLabView } from './components/views/StrapLabView';
import { MoreView } from './components/views/MoreView';
import { OledSleepOverlay } from './components/views/OledSleepOverlay';
import { QuickActionModal } from './components/QuickActionModal';
import { StrapConnectSheet } from './components/StrapConnectSheet';
import { WorkoutHudModal } from './components/views/WorkoutHudModal';
import { DynamicIslandBanner } from './components/DynamicIslandBanner';
import { NotificationDrawerModal } from './components/NotificationDrawerModal';
import { DailyJournalModal } from './components/DailyJournalModal';
import { SleepPlannerModal } from './components/SleepPlannerModal';
import { StrengthTrainerModal } from './components/StrengthTrainerModal';
import { HealthMonitorModal } from './components/HealthMonitorModal';
import { StressMonitorModal } from './components/StressMonitorModal';
import { SleepStageDetailModal } from './components/SleepStageDetailModal';
import { WhoopCoachChatSheet } from './components/WhoopCoachChatSheet';
import { HardwareDiagnosticsModal } from './components/HardwareDiagnosticsModal';
import { HrvBreathePacer } from './components/HrvBreathePacer';
import { HapticAlarmModal } from './components/HapticAlarmModal';
import { ShareCardModal, type ShareCardType } from './components/ShareCardModal';
import { WhoopCalendarSheet } from './components/WhoopCalendarSheet';
import { alarmEngine } from './services/alarmEngine';
import { notificationEngine } from './services/notificationEngine';
import { telemetryWorkerManager } from './services/telemetryWorkerManager';
import { hapticMedium, hapticLight } from './utils/haptics';

import { AlertCircle, X, Plus, AlertTriangle, Wind, Dumbbell, Moon, Clock, ShieldCheck } from 'lucide-react';
import { useLanguage } from './i18n/LanguageContext';

export const App: React.FC = () => {
  const { t, isRtl } = useLanguage();

  // --- User Settings & Biometrics ---
  const [settings, setSettings] = useState<UserSettings>(() => {
    return storageService.getUserSettings();
  });

  // --- Navigation States (Official 4 Tabs: Home, Health, Strap, More) ---
  const [mainTab, setMainTab] = useState<MainTabType>('home');
  const [homeSubTab, setHomeSubTab] = useState<HomeSubTab>('overview');
  const [selectedDateIndex, setSelectedDateIndex] = useState(0); // 0 = TODAY, 1 = YESTERDAY...
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => localDateKey());
  const [isCalendarSheetOpen, setIsCalendarSheetOpen] = useState(false);

  // --- Real 7-Day History Records from Storage ---
  const [daysHistory, setDaysHistory] = useState(() => storageService.getDaysHistory());

  const [isStrapSheetOpen, setIsStrapSheetOpen] = useState(() =>
    typeof window !== 'undefined' && (window.location.search.includes('sheet=strap') || window.location.hash === '#strap')
  );
  const [isWorkoutHudOpen, setIsWorkoutHudOpen] = useState(false);
  const [isOledNightLockOpen, setIsOledNightLockOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(() =>
    notificationEngine.getUnreadCount()
  );
  const [isDailyJournalOpen, setIsDailyJournalOpen] = useState(false);
  const [isSleepPlannerOpen, setIsSleepPlannerOpen] = useState(false);
  const [isStrengthTrainerOpen, setIsStrengthTrainerOpen] = useState(false);
  const [isHealthMonitorOpen, setIsHealthMonitorOpen] = useState(false);
  const [isStressMonitorOpen, setIsStressMonitorOpen] = useState(false);
  const [isSleepDetailOpen, setIsSleepDetailOpen] = useState(false);
  const [isCoachChatOpen, setIsCoachChatOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isHrvBreatheOpen, setIsHrvBreatheOpen] = useState(false);
  const [isHapticAlarmOpen, setIsHapticAlarmOpen] = useState(false);
  const [isShareCardOpen, setIsShareCardOpen] = useState(false);
  const [shareCardType, setShareCardType] = useState<ShareCardType>('recovery');
  const [shareSession, setShareSession] = useState<SessionRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Bluetooth Device Permissions API permitted devices cache
  const [permittedDevices, setPermittedDevices] = useState<BluetoothDevice[]>([]);

  useEffect(() => {
    whoopBleEngine.checkPermittedDevices().then((devs) => {
      setPermittedDevices(devs);
    });
  }, []);

  useEffect(() => {
    return notificationEngine.subscribe(() => {
      setUnreadNotificationsCount(notificationEngine.getUnreadCount());
    });
  }, []);

  const handleBannerAction = (actionType: string) => {
    if (actionType === 'open_breathe') {
      setIsHrvBreatheOpen(true);
    } else if (actionType === 'open_strap') {
      setIsStrapSheetOpen(true);
    } else if (actionType === 'open_journal') {
      setIsDailyJournalOpen(true);
    } else if (actionType === 'open_recovery') {
      setMainTab('home');
      setHomeSubTab('recovery');
    } else if (actionType === 'confirm_detected_activity') {
      setMainTab('home');
      setHomeSubTab('overview');
    }
  };

  // --- Real BLE Hardware State (100% Real Sensor Data Only) ---
  const [metadata, setMetadata] = useState<DeviceMetadata>(() => whoopBleEngine.getMetadata());

  // --- Live Metrics State (Initial Disconnected Calibrating State) ---
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>(() =>
    biometricEngine.getInitialDisconnectedMetrics()
  );

  // --- Active Workout State ---
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [workoutElapsedSec, setWorkoutElapsedSec] = useState(0);
  const [activeSportTitle, setActiveSportTitle] = useState('Running');
  const [workoutSamples, setWorkoutSamples] = useState<Array<{ timestamp: number; hr: number; hrv: number }>>([]);

  // --- Real Recorded Sessions & Packets ---
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [services, setServices] = useState<GattServiceInfo[]>([]);
  const [packets, setPackets] = useState<RawBlePacket[]>([]);

  // Load real saved sessions & packets from IndexedDB
  const refreshSessions = useCallback(async () => {
    try {
      const all = await storageService.getAllSessions();
      setSessions(all);
      setDaysHistory(storageService.getDaysHistory());
    } catch (e) {
      console.warn('Failed loading sessions:', e);
    }
  }, []);

  const refreshPackets = useCallback(async () => {
    try {
      const recent = await storageService.getRecentRawPackets(80);
      setPackets(recent);
    } catch (e) {
      console.warn('Failed loading packets:', e);
    }
  }, []);

  useEffect(() => {
    refreshSessions();
    refreshPackets();
  }, [refreshSessions, refreshPackets]);

  // Workout live timer loop using unthrottled Web Worker (immune to tab throttling)
  useEffect(() => {
    if (isWorkoutActive && workoutStartTime) {
      const unsub = telemetryWorkerManager.subscribe(() => {
        setWorkoutElapsedSec(Math.floor((Date.now() - workoutStartTime) / 1000));
      });
      return unsub;
    } else {
      setWorkoutElapsedSec(0);
    }
  }, [isWorkoutActive, workoutStartTime]);

  // Mobile background audio keep-alive to prevent BLE stream sleep
  useEffect(() => {
    if (metadata.connected) {
      telemetryWorkerManager.enableBackgroundKeepAlive();
    } else {
      telemetryWorkerManager.disableBackgroundKeepAlive();
    }
    return () => {
      telemetryWorkerManager.disableBackgroundKeepAlive();
    };
  }, [metadata.connected]);

  // Ingest 100% real sample from physical strap
  const handleMeasurement = useCallback((measurement: Parameters<typeof biometricEngine.ingestSample>[0]) => {
    const updated = biometricEngine.ingestSample(measurement);
    setLiveMetrics(updated);

    if (isWorkoutActive && measurement.bpm > 0) {
      setWorkoutSamples((prev) => [
        ...prev,
        {
          timestamp: measurement.timestamp,
          hr: measurement.bpm,
          hrv: updated.currentHrv || 0,
        },
      ]);
    }
  }, [isWorkoutActive]);

  // Subscribe to real BLE events
  useEffect(() => {
    const unsubHr = whoopBleEngine.onHeartRate((measurement) => {
      handleMeasurement(measurement);
    });

    const unsubBat = whoopBleEngine.onBattery((level) => {
      setMetadata((prev) => ({ ...prev, batteryLevel: level }));
    });

    const unsubMeta = whoopBleEngine.onMetadata((meta) => {
      setMetadata(meta);
    });

    const unsubPkt = whoopBleEngine.onPacket((pkt) => {
      setPackets((prev) => [pkt, ...prev.slice(0, 99)]);
    });

    const unsubGatt = whoopBleEngine.onGattTree((tree) => {
      setServices(tree);
    });

    const unsubErr = whoopBleEngine.onError((err) => {
      setErrorMessage(err);
    });

    return () => {
      unsubHr();
      unsubBat();
      unsubMeta();
      unsubPkt();
      unsubGatt();
      unsubErr();
    };
  }, [handleMeasurement]);

  // Connect BLE flow (Physical WHOOP 4.0 Strap) with Specific Filters
  const handleConnectBle = async (mode: 'filtered' | 'all' = 'filtered') => {
    try {
      setErrorMessage(null);
      await whoopBleEngine.connect(mode);
      const updatedPermitted = await whoopBleEngine.checkPermittedDevices();
      setPermittedDevices(updatedPermitted);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes('cancelled') && !msg.includes('User cancelled')) {
        setErrorMessage(msg);
      }
    }
  };

  // 1-Click Reconnect to Permitted Device without Chooser Dialog
  const handleReconnectPermitted = async (device?: BluetoothDevice) => {
    try {
      setErrorMessage(null);
      await whoopBleEngine.reconnectPermittedDevice(device);
      const updatedPermitted = await whoopBleEngine.checkPermittedDevices();
      setPermittedDevices(updatedPermitted);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMessage(msg);
    }
  };

  const handleDisconnectBle = () => {
    whoopBleEngine.disconnect();
    setLiveMetrics(biometricEngine.getInitialDisconnectedMetrics());
  };

  // Workout start & stop
  const handleStartWorkout = (sport: string) => {
    setIsWorkoutActive(true);
    setWorkoutStartTime(Date.now());
    setActiveSportTitle(sport);
    setWorkoutSamples([]);
    setIsWorkoutHudOpen(true);
  };

  const handleStopWorkout = async () => {
    if (!workoutStartTime) return;
    const endTime = Date.now();
    const evaluated = biometricEngine.evaluateWorkoutSession(workoutStartTime, endTime, workoutSamples);

    const record: SessionRecord = {
      id: `workout-${Date.now()}`,
      type: 'workout',
      title: activeSportTitle,
      sport: activeSportTitle,
      ...evaluated,
    };

    await storageService.saveSession(record);
    await refreshSessions();

    setIsWorkoutActive(false);
    setWorkoutStartTime(null);
    setWorkoutSamples([]);
    setIsWorkoutHudOpen(false);
  };

  const handleSaveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    storageService.saveUserSettings(newSettings);
    biometricEngine.updateSettings(newSettings);
  };

  const handleResetDayCounters = () => {
    biometricEngine.resetDayCounters();
    setLiveMetrics(biometricEngine.getInitialDisconnectedMetrics());
  };

  // --- Effective Metrics based on Selected Date Cycle (100% Offline Archival) ---
  const isViewingToday = selectedDateStr === localDateKey();

  const handlePrevDate = () => {
    const parts = selectedDateStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() - 1);
    setSelectedDateStr(localDateKey(d));
  };

  const handleNextDate = () => {
    if (selectedDateStr >= localDateKey()) return;
    const parts = selectedDateStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + 1);
    setSelectedDateStr(localDateKey(d));
  };

  const topBarDateLabel = useMemo(() => {
    const today = localDateKey();
    if (selectedDateStr === today) return 'TODAY';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (selectedDateStr === localDateKey(yesterday)) return 'YESTERDAY';
    const parts = selectedDateStr.split('-').map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase();
    }
    return selectedDateStr;
  }, [selectedDateStr]);

  const currentDayRecord: DayHistoryRecord = useMemo(() => {
    if (isViewingToday) {
      return daysHistory[0] || {
        offset: 0,
        label: 'TODAY',
        date: localDateKey(),
        dayStrain: liveMetrics.dailyStrain,
        recoveryScore: liveMetrics.recoveryScore,
        recoveryCategory: liveMetrics.recoveryCategory,
        sleepPerformance: liveMetrics.sleepPerformance,
        hoursAsleep: liveMetrics.hoursAsleep ?? null,
        hoursInBed: liveMetrics.hoursInBed ?? null,
        sleepNeedHours: null,
        sleepHours: liveMetrics.hoursAsleep ?? null,
        sleepNeededHours: null,
        deepHours: null,
        remHours: null,
        lightHours: null,
        awakeHours: null,
        sleepEfficiency: null,
        bedtime: null,
        wakeTime: null,
        sleepTimeline: [],
        rhr: liveMetrics.restingHr,
        hrv: liveMetrics.currentHrv,
        respiratoryRate: liveMetrics.respiratoryRate,
        skinTempCelsius: liveMetrics.skinTempCelsius,
        skinTempDelta: liveMetrics.skinTempDelta,
        spO2: liveMetrics.spO2,
        activeCalories: liveMetrics.activeCalories,
        bmrCalories: liveMetrics.bmrCalories,
        totalCalories: liveMetrics.totalCalories,
        steps: liveMetrics.steps,
        zoneSeconds: liveMetrics.zoneSeconds,
        sessions: [],
        stressPoints: [],
        hasRealData: true,
      };
    }

    const found = daysHistory.find((d) => d.date === selectedDateStr);
    if (found) return found;

    const stored = storageService.getRealDayState(selectedDateStr);
    const dObj = new Date(selectedDateStr + 'T12:00:00');
    const label = dObj.toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase();

    if (stored) {
      return {
        offset: 99,
        label,
        date: selectedDateStr,
        dayStrain: stored.dayStrain || 0,
        recoveryScore: stored.recoveryScore || null,
        recoveryCategory: stored.recoveryCategory || 'calibrating',
        sleepPerformance: stored.sleepPerformance || null,
        hoursAsleep: stored.hoursAsleep || stored.sleepHours || null,
        hoursInBed: stored.hoursInBed || null,
        sleepNeedHours: stored.sleepNeedHours || null,
        sleepHours: stored.sleepHours || null,
        sleepNeededHours: stored.sleepNeededHours || null,
        deepHours: stored.deepHours || null,
        remHours: stored.remHours || null,
        lightHours: stored.lightHours || null,
        awakeHours: stored.awakeHours || null,
        sleepEfficiency: stored.sleepEfficiency || null,
        bedtime: stored.bedtime || null,
        wakeTime: stored.wakeTime || null,
        sleepTimeline: stored.sleepTimeline || [],
        rhr: stored.rhr || null,
        hrv: stored.hrv || null,
        respiratoryRate: stored.respiratoryRate || null,
        skinTempCelsius: stored.skinTempCelsius || null,
        skinTempDelta: stored.skinTempDelta || null,
        spO2: stored.spO2 || null,
        activeCalories: stored.activeCalories || 0,
        bmrCalories: stored.bmrCalories || 0,
        totalCalories: stored.totalCalories || 0,
        steps: stored.steps || 0,
        zoneSeconds: stored.zoneSeconds || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        sessions: storageService.getWorkoutsForDate(selectedDateStr),
        stressPoints: stored.stressPoints || [],
        hasRealData: true,
      };
    }

    return {
      offset: 99,
      label,
      date: selectedDateStr,
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
    };
  }, [selectedDateStr, isViewingToday, daysHistory, liveMetrics]);

  const sleepData: SleepMetrics = useMemo(() => {
    const perf = isViewingToday ? liveMetrics.sleepPerformance : currentDayRecord.sleepPerformance;
    const strain = isViewingToday ? liveMetrics.dailyStrain : currentDayRecord.dayStrain;
    return generateSleepMetrics(perf, settings, strain);
  }, [isViewingToday, liveMetrics.sleepPerformance, liveMetrics.dailyStrain, currentDayRecord, settings]);

  // Live Biometric & Sleep Goal Alarm Evaluation
  useEffect(() => {
    alarmEngine.evaluateBiometricAlarm(liveMetrics, sleepData);
  }, [liveMetrics, sleepData]);

  const effectiveMetrics: LiveMetrics = useMemo(() => {
    if (isViewingToday) {
      return {
        ...liveMetrics,
        hoursAsleep: sleepData.hoursAsleep,
        hoursInBed: sleepData.hoursInBed,
      };
    }

    // Historical cycle snapshot: restore 100% preserved offline health metrics
    const bmr = biometricEngine.calculateDailyBmr(settings);
    return {
      currentHr: null, // Zero synthetic live HR on past cycles
      currentHrv: currentDayRecord.hrv,
      lockedHrv: currentDayRecord.hrv,
      dailyRecoveryLock: currentDayRecord.recoveryScore
        ? {
            date: selectedDateStr,
            recoveryScore: currentDayRecord.recoveryScore,
            recoveryCategory: currentDayRecord.recoveryCategory,
            lockedHrv: currentDayRecord.hrv || settings.hrvBaseline,
            lockedRhr: currentDayRecord.rhr || settings.restingHrBaseline,
            lockedRespiratoryRate: currentDayRecord.respiratoryRate ?? null,
            lockedSkinTempCelsius: currentDayRecord.skinTempCelsius ?? null,
            lockedSkinTempDelta: currentDayRecord.skinTempDelta ?? null,
            lockedSpO2: currentDayRecord.spO2 ?? null,
            lockedAt: 0,
            source: 'sleep',
          }
        : null,
      sdnn: null,
      meanRR: null,
      lastRR: null,
      minHr: null,
      maxHr: null,
      avgHr: null,
      restingHr: currentDayRecord.rhr,
      dailyStrain: currentDayRecord.dayStrain,
      recoveryScore: currentDayRecord.recoveryScore,
      recoveryCategory: currentDayRecord.recoveryCategory,
      sleepPerformance: currentDayRecord.sleepPerformance,
      hoursAsleep: currentDayRecord.hoursAsleep ?? currentDayRecord.sleepHours ?? null,
      hoursInBed: currentDayRecord.hoursInBed ?? null,
      activeCalories: currentDayRecord.activeCalories,
      bmrCalories: currentDayRecord.bmrCalories || bmr,
      totalCalories: currentDayRecord.totalCalories || (currentDayRecord.activeCalories + bmr),
      steps: currentDayRecord.steps || 0,
      cadence: 0,
      stepSource: 'imu_hardware',
      currentZone: 0,
      zoneSeconds: currentDayRecord.zoneSeconds || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      optimalStrainTarget: calculateOptimalStrainTarget(currentDayRecord.recoveryScore),
      respiratoryRate: currentDayRecord.respiratoryRate ?? null,
      lockedRespiratoryRate: currentDayRecord.respiratoryRate ?? null,
      stressScore: null,
      stressCategory: null,
      skinTempCelsius: currentDayRecord.skinTempCelsius ?? null,
      skinTempDelta: currentDayRecord.skinTempDelta ?? null,
      lockedSkinTempCelsius: currentDayRecord.skinTempCelsius ?? null,
      lockedSkinTempDelta: currentDayRecord.skinTempDelta ?? null,
      spO2: currentDayRecord.spO2 ?? null,
      lockedSpO2: currentDayRecord.spO2 ?? null,
      spO2NightlyAvg: currentDayRecord.spO2 ?? null,
      spO2DipsCount: 0,
      vo2Max: null,
      sd1: null,
      sd2: null,
      baevskyIndex: null,
      onWrist: null,
      timestamp: Date.now(),
    };
  }, [isViewingToday, liveMetrics, sleepData, currentDayRecord, settings, selectedDateStr]);

  const effectiveSessions: SessionRecord[] = useMemo(() => {
    if (isViewingToday) {
      return sessions;
    }
    return sessions.filter((s) => localDateKey(s.startTime) === selectedDateStr);
  }, [isViewingToday, sessions, selectedDateStr]);

  const healthMetrics: HealthMonitorMetric[] = useMemo(() => {
    return generateHealthMonitorMetrics(
      effectiveMetrics.currentHrv,
      effectiveMetrics.restingHr,
      effectiveMetrics.respiratoryRate,
      settings,
      effectiveMetrics.skinTempCelsius,
      effectiveMetrics.spO2,
      effectiveMetrics.skinTempDelta
    );
  }, [
    effectiveMetrics.currentHrv,
    effectiveMetrics.restingHr,
    effectiveMetrics.respiratoryRate,
    effectiveMetrics.skinTempCelsius,
    effectiveMetrics.spO2,
    effectiveMetrics.skinTempDelta,
    settings,
  ]);

  const zones = biometricEngine.getZones();

  return (
    <div className="min-h-screen bg-[#07090C] text-white flex justify-center items-center font-sans antialiased selection:bg-[#0093E9] selection:text-black relative overflow-x-hidden md:py-6">
      {/* Studio Radial Atmospheric Ambient Glows on Desktop */}
      <div className="fixed inset-0 pointer-events-none hidden md:block overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-[#00A3FF]/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-[#16EC06]/8 blur-[160px] rounded-full" />
      </div>

      {/* Desktop Companion Wing - Left (visible on xl screens) */}
      <div className="hidden xl:flex flex-col justify-between w-64 h-[860px] p-6 text-zinc-400 select-none border-y border-l border-white/5 bg-[#0C0F14]/80 rounded-l-[32px] backdrop-blur-xl shadow-2xl">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-black text-sm">
              W
            </div>
            <div>
              <div className="text-sm font-black tracking-widest text-white uppercase font-condensed">WHOOP 4.0</div>
              <div className="text-[10px] text-zinc-500 font-mono">WEB BLE INTERFACE</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#12161E] border border-white/5 space-y-2">
            <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-condensed">
              {isRtl ? 'حالة السوار الفعلي' : 'STRAP HARDWARE STATUS'}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white truncate max-w-[140px]">
                {metadata.connected ? metadata.name : (isRtl ? 'غير متصل' : 'Disconnected')}
              </span>
              <span className={`w-2.5 h-2.5 rounded-full ${metadata.connected ? 'bg-[#16EC06] shadow-sm shadow-[#16EC06]' : 'bg-zinc-600'}`} />
            </div>
            {metadata.connected ? (
              <div className="text-[11px] font-mono text-[#16EC06]">
                {metadata.batteryLevel ?? '--'}% • {metadata.isCharging ? (isRtl ? 'قيد الشحن' : 'Charging') : (isRtl ? 'بطارية' : 'Battery')}
              </div>
            ) : (
              <div className="text-[11px] font-mono text-zinc-500">
                {isRtl ? 'جاهز للاقتران' : 'Ready to pair'}
              </div>
            )}
            <button
              onClick={() => setIsStrapSheetOpen(true)}
              className="w-full mt-2 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-condensed font-black uppercase tracking-wider transition-all"
            >
              {metadata.connected ? (isRtl ? 'إدارة السوار' : 'Manage Device') : (isRtl ? 'ربط السوار' : 'Connect Strap')}
            </button>
          </div>
        </div>

        <div className="space-y-2 text-[10px] text-zinc-500 font-sans leading-relaxed border-t border-white/5 pt-4">
          <div className="flex items-center gap-1.5 text-zinc-400 font-condensed font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16EC06]" />
            <span>{isRtl ? 'دقة فسيولوجية 100%' : '100% CLINICAL FIDELITY'}</span>
          </div>
          <p>
            {isRtl
              ? 'تتم معالجة جميع إشارات التخطيط الضوئي (PPG) وحسابات تقلب النبض والجهد ومراحل النوم محلياً بالكامل وبدون أي بيانات وهمية.'
              : 'All optical PPG telemetry, HRV, strain models, and sleep staging are calculated locally with zero synthetic data.'}
          </p>
        </div>
      </div>

      {/* Main Mobile Chassis Container */}
      <div className="w-full max-w-[430px] min-h-dvh md:min-h-[860px] md:max-h-[880px] bg-gradient-to-b from-[#161B22] via-[#0B0D10] to-[#000000] flex flex-col relative md:border md:border-white/15 md:rounded-[44px] md:shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_50px_rgba(0,163,255,0.08)] overflow-hidden z-10">
        {/* Dynamic Island Floating Athletic Banner */}
        <DynamicIslandBanner onAction={handleBannerAction} />

        {/* Top WHOOP Bar & Home Sub-Tabs */}
        <WhoopTopBar
          metadata={metadata}
          metrics={effectiveMetrics}
          mainTab={mainTab}
          activeSubTab={homeSubTab}
          onChangeSubTab={(tab) => {
            setMainTab('home');
            setHomeSubTab(tab);
          }}
          onOpenStrapSheet={() => setIsStrapSheetOpen(true)}
          onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
          unreadNotificationsCount={unreadNotificationsCount}
          selectedDate={topBarDateLabel}
          onPrevDate={handlePrevDate}
          onNextDate={handleNextDate}
          onOpenCalendar={() => setIsCalendarSheetOpen(true)}
        />

        {/* Historical Cycle Banner with Quick Return Button */}
        {!isViewingToday && (
          <div className="mx-3 mt-2 bg-[#1C212B] border border-[#00A3FF]/40 rounded-xl px-3.5 py-2 flex items-center justify-between shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00A3FF] animate-pulse" />
              <span className="text-xs font-condensed font-bold text-zinc-200">
                {isRtl ? `عرض دورة أرشيفية: ${selectedDateStr}` : `Viewing Historical Cycle: ${selectedDateStr}`}
              </span>
            </div>
            <button
              onClick={() => setSelectedDateStr(localDateKey())}
              className="text-[10px] font-condensed font-black uppercase text-[#00A3FF] hover:text-white px-2 py-0.5 rounded-md bg-[#00A3FF]/10 hover:bg-[#00A3FF]/20 transition-colors"
            >
              {isRtl ? 'العودة لليوم' : 'Return to Today'}
            </button>
          </div>
        )}

        {/* Off-Wrist / No Skin Contact Amber Warning Banner */}
        {metadata.connected && metadata.onWrist === false && (
          <div className="mx-3 mt-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-300 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
              <span className="font-condensed font-bold tracking-wide">
                {t('bandOffWristAlert')}
              </span>
            </div>
            <span className="text-[10px] text-amber-400/80 font-mono font-bold uppercase">
              {t('paused')}
            </span>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mx-3 mt-2 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2 text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span className="truncate">{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="p-1 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 px-4 pt-3 overflow-y-auto">
          {/* TAB 1: HOME (Sub-tabs: Overview | Sleep | Recovery | Strain) */}
          {mainTab === 'home' && (
            <>
              {homeSubTab === 'overview' && (
                <OverviewView
                  metrics={effectiveMetrics}
                  healthMetrics={healthMetrics}
                  sessions={effectiveSessions}
                  settings={settings}
                  metadata={metadata}
                  daysHistory={daysHistory}
                  onSelectSubTab={setHomeSubTab}
                  onOpenHealthMonitorModal={() => setIsHealthMonitorOpen(true)}
                  onOpenStressMonitorModal={() => setIsStressMonitorOpen(true)}
                  onOpenSleepDetailModal={() => setIsSleepDetailOpen(true)}
                  onOpenCoachChat={() => setIsCoachChatOpen(true)}
                  onStartActivity={() => handleStartWorkout('Running')}
                  onOpenJournal={() => setIsDailyJournalOpen(true)}
                  onOpenSleepPlanner={() => setIsSleepPlannerOpen(true)}
                  onOpenShareCard={(type) => {
                    setShareCardType(type);
                    setIsShareCardOpen(true);
                  }}
                  onRefreshSessions={refreshSessions}
                />
              )}

              {homeSubTab === 'sleep' && (
                <SleepView
                  metrics={effectiveMetrics}
                  sleepData={sleepData}
                  daysHistory={daysHistory}
                  onActivateOledNightLock={() => setIsOledNightLockOpen(true)}
                />
              )}

              {homeSubTab === 'recovery' && (
                <RecoveryView
                  metrics={effectiveMetrics}
                  settings={settings}
                  daysHistory={daysHistory}
                  onOpenShareCard={(type) => {
                    setShareCardType(type);
                    setIsShareCardOpen(true);
                  }}
                />
              )}

              {homeSubTab === 'strain' && (
                <StrainView
                  metrics={effectiveMetrics}
                  zones={zones}
                  settings={settings}
                  daysHistory={daysHistory}
                  onStartWorkout={handleStartWorkout}
                  onStopWorkout={handleStopWorkout}
                  isWorkoutActive={isWorkoutActive}
                  workoutElapsedSec={workoutElapsedSec}
                  onOpenShareCard={(type) => {
                    setShareCardType(type);
                    setIsShareCardOpen(true);
                  }}
                />
              )}
            </>
          )}

          {/* TAB 2: PLAN (02:15 in Video) */}
          {mainTab === 'plan' && (
            <PlanView
              metrics={effectiveMetrics}
              settings={settings}
              daysHistory={daysHistory}
              onOpenSleepPlanner={() => setIsSleepPlannerOpen(true)}
              onOpenAlarmModal={() => setIsHapticAlarmOpen(true)}
            />
          )}

          {/* TAB 3: COMMUNITY (02:29 in Video) */}
          {mainTab === 'community' && (
            <CommunityView
              metrics={effectiveMetrics}
              settings={settings}
              onOpenBreathePacer={() => setIsHrvBreatheOpen(true)}
            />
          )}

          {/* TAB 4: MORE (02:43 in Video) */}
          {mainTab === 'more' && (
            <MoreView
              settings={settings}
              sessions={effectiveSessions}
              metadata={metadata}
              services={services}
              packets={packets}
              onConnectBle={handleConnectBle}
              onDisconnectBle={handleDisconnectBle}
              onClearPackets={() => setPackets([])}
              onSaveSettings={handleSaveSettings}
              onResetDayCounters={handleResetDayCounters}
              onRefreshSessions={refreshSessions}
              onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
            />
          )}
        </main>

        {/* Floating Action Button (+) */}
        <button
          onClick={() => {
            hapticMedium();
            setIsQuickActionOpen(true);
          }}
          className={`w-14 h-14 rounded-full bg-white text-black shadow-2xl absolute bottom-20 ${isRtl ? 'left-5' : 'right-5'} z-30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform`}
          title={isRtl ? 'بدء تمرين مباشر أو نوم' : 'Start Live Workout or Sleep'}
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>

        {/* 4-Tab Bottom Navigation Bar */}
        <WhoopBottomNav
          activeTab={mainTab}
          onChangeTab={setMainTab}
          packetCount={packets.length}
        />

        {/* Quick Action Modal */}
        <QuickActionModal
          isOpen={isQuickActionOpen}
          onClose={() => setIsQuickActionOpen(false)}
          onSelectAction={(action) => {
            if (action === 'strength') setIsStrengthTrainerOpen(true);
            if (action === 'activity') handleStartWorkout('Running');
            if (action === 'journal') setIsDailyJournalOpen(true);
            if (action === 'sleep_planner') setIsSleepPlannerOpen(true);
            if (action === 'alarm') setIsHapticAlarmOpen(true);
            if (action === 'sleep') setIsOledNightLockOpen(true);
            if (action === 'breathe') setIsHrvBreatheOpen(true);
          }}
        />

        {/* Real-Time Notification Center Drawer Modal */}
        <NotificationDrawerModal
          isOpen={isNotificationDrawerOpen}
          onClose={() => setIsNotificationDrawerOpen(false)}
          onOpenAction={handleBannerAction}
        />

        {/* WHOOP Daily Journal Modal */}
        <DailyJournalModal
          isOpen={isDailyJournalOpen}
          onClose={() => setIsDailyJournalOpen(false)}
          metrics={effectiveMetrics}
        />

        {/* WHOOP Sleep Planner & Smart Alarm Modal */}
        <SleepPlannerModal
          isOpen={isSleepPlannerOpen}
          onClose={() => setIsSleepPlannerOpen(false)}
          metrics={effectiveMetrics}
          settings={settings}
          onLaunchOledNightLock={() => setIsOledNightLockOpen(true)}
        />

        {/* WHOOP Strength Trainer Modal */}
        <StrengthTrainerModal
          isOpen={isStrengthTrainerOpen}
          onClose={() => setIsStrengthTrainerOpen(false)}
          metrics={effectiveMetrics}
        />

        {/* Real WHOOP 4.0 Strap Connection Bottom Sheet Modal */}
        <StrapConnectSheet
          isOpen={isStrapSheetOpen}
          onClose={() => setIsStrapSheetOpen(false)}
          metadata={metadata}
          permittedDevices={permittedDevices}
          onConnectBle={handleConnectBle}
          onReconnectPermitted={handleReconnectPermitted}
          onDisconnectBle={handleDisconnectBle}
          onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        />

        {/* Real Hardware Diagnostics Modal */}
        <HardwareDiagnosticsModal
          isOpen={isDiagnosticsOpen}
          onClose={() => setIsDiagnosticsOpen(false)}
          metadata={metadata}
        />

        {/* Full-Screen Live Workout HUD Modal */}
        <WorkoutHudModal
          isOpen={isWorkoutHudOpen}
          onClose={() => setIsWorkoutHudOpen(false)}
          sport={activeSportTitle}
          elapsedSec={workoutElapsedSec}
          currentHr={liveMetrics.currentHr}
          activeCalories={liveMetrics.activeCalories}
          metrics={liveMetrics}
          zones={zones}
          settings={settings}
          onEndAndSave={handleStopWorkout}
        />

        {/* OLED Night Lock Overlay */}
        <OledSleepOverlay
          isOpen={isOledNightLockOpen}
          onClose={() => setIsOledNightLockOpen(false)}
          metrics={effectiveMetrics}
          metadata={metadata}
        />

        {/* Health Monitor Full Modal (00:08–00:15 in Video) */}
        <HealthMonitorModal
          isOpen={isHealthMonitorOpen}
          onClose={() => setIsHealthMonitorOpen(false)}
          metrics={effectiveMetrics}
          healthMetrics={healthMetrics}
          settings={settings}
          metadata={metadata}
        />

        {/* Stress Monitor Full Modal (00:21–00:30 in Video) */}
        <StressMonitorModal
          isOpen={isStressMonitorOpen}
          onClose={() => setIsStressMonitorOpen(false)}
          metrics={effectiveMetrics}
          settings={settings}
        />

        {/* Sleep Stage Detail Modal (00:34–00:51 in Video) */}
        <SleepStageDetailModal
          isOpen={isSleepDetailOpen}
          onClose={() => setIsSleepDetailOpen(false)}
          metrics={effectiveMetrics}
          sleepData={sleepData}
        />

        {/* WHOOP Coach AI Telemetry Chat Sheet */}
        <WhoopCoachChatSheet
          isOpen={isCoachChatOpen}
          onClose={() => setIsCoachChatOpen(false)}
          metrics={effectiveMetrics}
          settings={settings}
        />

        {/* HRV Resonance Coherence Breathe Pacer Modal */}
        {isHrvBreatheOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in"
            onClick={() => setIsHrvBreatheOpen(false)}
          >
            <div
              className="w-full max-w-[430px] p-5 rounded-[28px] bg-[#16191E] border border-white/10 shadow-2xl space-y-4 animate-in slide-in-from-bottom"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-[#00F0FF]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
                    {isRtl ? 'جلسة تنفس الرنين (HRV Coherence)' : 'HRV Resonance Breathe Pacer'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsHrvBreatheOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <HrvBreathePacer metrics={effectiveMetrics} onClose={() => setIsHrvBreatheOpen(false)} />
            </div>
          </div>
        )}

        {/* WHOOP Silent Haptic Alarm Modal */}
        <HapticAlarmModal
          isOpen={isHapticAlarmOpen}
          onClose={() => setIsHapticAlarmOpen(false)}
        />

        {/* WHOOP High-Resolution Social Scorecard Share Modal */}
        <ShareCardModal
          isOpen={isShareCardOpen}
          onClose={() => setIsShareCardOpen(false)}
          initialType={shareCardType}
          metrics={effectiveMetrics}
          settings={settings}
          session={shareSession}
        />

        {/* WHOOP Cycles Calendar Sheet */}
        <WhoopCalendarSheet
          isOpen={isCalendarSheetOpen}
          onClose={() => setIsCalendarSheetOpen(false)}
          selectedDateStr={selectedDateStr}
          onSelectDate={(dateStr) => {
            setSelectedDateStr(dateStr);
            setDaysHistory(storageService.getDaysHistory(30));
          }}
        />
      </div>

      {/* Desktop Companion Wing - Right (visible on xl screens) */}
      <div className="hidden xl:flex flex-col justify-between w-64 h-[860px] p-6 text-zinc-400 select-none border-y border-r border-white/5 bg-[#0C0F14]/80 rounded-r-[32px] backdrop-blur-xl shadow-2xl">
        <div className="space-y-4">
          <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-condensed">
            {isRtl ? 'اختصارات سريعة' : 'QUICK ACTIONS'}
          </div>
          <div className="space-y-2">
            <button
              onClick={() => setIsStrengthTrainerOpen(true)}
              className="w-full p-2.5 rounded-xl bg-[#12161E] hover:bg-[#1A202A] border border-white/5 flex items-center gap-2.5 text-xs font-bold text-white font-condensed uppercase tracking-wide transition-all"
            >
              <Dumbbell className="w-4 h-4 text-[#00A3FF]" />
              <span>{isRtl ? 'تدريب القوة' : 'Strength Trainer'}</span>
            </button>
            <button
              onClick={() => setIsSleepPlannerOpen(true)}
              className="w-full p-2.5 rounded-xl bg-[#12161E] hover:bg-[#1A202A] border border-white/5 flex items-center gap-2.5 text-xs font-bold text-white font-condensed uppercase tracking-wide transition-all"
            >
              <Moon className="w-4 h-4 text-[#7293B2]" />
              <span>{isRtl ? 'مخطط النوم' : 'Sleep Planner'}</span>
            </button>
            <button
              onClick={() => setIsHapticAlarmOpen(true)}
              className="w-full p-2.5 rounded-xl bg-[#12161E] hover:bg-[#1A202A] border border-white/5 flex items-center gap-2.5 text-xs font-bold text-white font-condensed uppercase tracking-wide transition-all"
            >
              <Clock className="w-4 h-4 text-[#FFDE00]" />
              <span>{isRtl ? 'المنبه الحسي' : 'Haptic Alarm'}</span>
            </button>
            <button
              onClick={() => setIsHrvBreatheOpen(true)}
              className="w-full p-2.5 rounded-xl bg-[#12161E] hover:bg-[#1A202A] border border-white/5 flex items-center gap-2.5 text-xs font-bold text-white font-condensed uppercase tracking-wide transition-all"
            >
              <Wind className="w-4 h-4 text-[#16EC06]" />
              <span>{isRtl ? 'منظم التنفس' : 'Breathe Pacer'}</span>
            </button>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#12161E] border border-white/5 text-[11px] font-mono text-zinc-400 space-y-1.5">
          <div className="text-[10px] font-black uppercase text-zinc-500 font-condensed">
            {isRtl ? 'الدورة الفسيولوجية' : 'PHYSIOLOGICAL CYCLE'}
          </div>
          <div className="text-white font-bold">{selectedDateStr}</div>
          <div className="text-[#16EC06] text-[10px]">
            {isViewingToday ? (isRtl ? '● دورة اليوم الحية' : '● Live Active Cycle') : (isRtl ? '○ أرشيف تاريخي' : '○ Historical Archive')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
