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
import { RecoveryTestModal } from './components/RecoveryTestModal';
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
import { notificationEngine } from './services/notificationEngine';
import { telemetryWorkerManager } from './services/telemetryWorkerManager';

import { AlertCircle, X, Plus, AlertTriangle, Wind } from 'lucide-react';
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

  // --- Real 7-Day History Records from Storage ---
  const [daysHistory, setDaysHistory] = useState(() => storageService.getDaysHistory());

  // --- Modal States ---
  const [isStrapSheetOpen, setIsStrapSheetOpen] = useState(false);
  const [isWorkoutHudOpen, setIsWorkoutHudOpen] = useState(false);
  const [isRecoveryTestOpen, setIsRecoveryTestOpen] = useState(false);
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

  // --- Effective Metrics based on Date Carousel (Real Records Only) ---
  const currentDayRecord = daysHistory[selectedDateIndex] || daysHistory[0];

  const effectiveMetrics: LiveMetrics = useMemo(() => {
    if (selectedDateIndex === 0) {
      return {
        ...liveMetrics,
        hoursAsleep: sleepData.hoursAsleep,
        hoursInBed: sleepData.hoursInBed,
      };
    }

    // Historical day snapshot
    const bmr = biometricEngine.calculateDailyBmr(settings);
    return {
      currentHr: null,
      currentHrv: currentDayRecord.hrv,
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
      bmrCalories: bmr,
      totalCalories: currentDayRecord.activeCalories + bmr,
      steps: 0,
      cadence: 0,
      stepSource: 'imu_hardware',
      currentZone: 0,
      zoneSeconds: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      optimalStrainTarget: calculateOptimalStrainTarget(currentDayRecord.recoveryScore),
      respiratoryRate: null,
      stressScore: null,
      stressCategory: null,
      skinTempCelsius: null,
      skinTempDelta: null,
      spO2: null,
      spO2NightlyAvg: null,
      spO2DipsCount: 0,
      vo2Max: null,
      onWrist: null,
      timestamp: Date.now(),
    };
  }, [selectedDateIndex, liveMetrics, currentDayRecord, settings]);

  const effectiveSessions: SessionRecord[] = useMemo(() => {
    if (selectedDateIndex === 0) {
      return sessions;
    }
    const targetDate = currentDayRecord.date;
    return sessions.filter((s) => localDateKey(s.startTime) === targetDate);
  }, [selectedDateIndex, sessions, currentDayRecord]);

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

  const sleepData: SleepMetrics = useMemo(() => {
    return generateSleepMetrics(effectiveMetrics.sleepPerformance, settings, effectiveMetrics.dailyStrain);
  }, [effectiveMetrics.sleepPerformance, settings, effectiveMetrics.dailyStrain]);

  const zones = biometricEngine.getZones();
  const maxDayIndex = Math.min(6, daysHistory.length - 1);

  return (
    <div className="min-h-screen bg-[#0B0D10] text-white flex justify-center font-sans antialiased selection:bg-[#0093E9] selection:text-black">
      {/* Mobile Shell Container with subtle top atmospheric gradient */}
      <div className="w-full max-w-[430px] min-h-dvh bg-gradient-to-b from-[#161B22] via-[#0B0D10] to-[#000000] flex flex-col relative border-x border-white/5 shadow-2xl">
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
          selectedDate={currentDayRecord.label}
          onPrevDate={() => setSelectedDateIndex((prev) => (prev < maxDayIndex ? prev + 1 : prev))}
          onNextDate={() => setSelectedDateIndex((prev) => (prev > 0 ? prev - 1 : prev))}
        />

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
                  onOpenRecoveryTest={() => setIsRecoveryTestOpen(true)}
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
                />
              )}
            </>
          )}

          {/* TAB 2: PLAN (02:15 in Video) */}
          {mainTab === 'plan' && (
            <PlanView
              metrics={effectiveMetrics}
              settings={settings}
              onOpenSleepPlanner={() => setIsSleepPlannerOpen(true)}
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
          onClick={() => setIsQuickActionOpen(true)}
          className={`w-14 h-14 rounded-full bg-white text-black shadow-2xl fixed bottom-24 ${isRtl ? 'left-5' : 'right-5'} z-40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform`}
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
            if (action === 'sleep') setIsOledNightLockOpen(true);
            if (action === 'recovery_test') setIsRecoveryTestOpen(true);
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

        {/* 3-Minute Recovery Assessment Modal */}
        <RecoveryTestModal
          isOpen={isRecoveryTestOpen}
          onClose={() => setIsRecoveryTestOpen(false)}
          metrics={effectiveMetrics}
          settings={settings}
          onApplied={() => {
            setDaysHistory(storageService.getDaysHistory());
            refreshSessions();
          }}
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
      </div>
    </div>
  );
};

export default App;
