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

import { WhoopTopBar } from './components/WhoopTopBar';
import { WhoopBottomNav } from './components/WhoopBottomNav';
import { OverviewView } from './components/views/OverviewView';
import { HealthView } from './components/views/HealthView';
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

import { AlertCircle, X, Plus } from 'lucide-react';

export const App: React.FC = () => {
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // Workout live timer loop
  useEffect(() => {
    let interval: number | null = null;
    if (isWorkoutActive && workoutStartTime) {
      interval = window.setInterval(() => {
        setWorkoutElapsedSec(Math.floor((Date.now() - workoutStartTime) / 1000));
      }, 1000);
    } else {
      setWorkoutElapsedSec(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWorkoutActive, workoutStartTime]);

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

  // Connect BLE flow (Physical WHOOP 4.0 Strap)
  const handleConnectBle = async () => {
    try {
      setErrorMessage(null);
      await whoopBleEngine.connect();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes('cancelled') && !msg.includes('User cancelled')) {
        setErrorMessage(msg);
      }
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
      return liveMetrics;
    }

    // Historical day snapshot
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
      activeCalories: currentDayRecord.activeCalories,
      currentZone: 0,
      zoneSeconds: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      optimalStrainTarget: calculateOptimalStrainTarget(currentDayRecord.recoveryScore),
      respiratoryRate: null,
      stressScore: null,
      stressCategory: null,
      onWrist: null,
      timestamp: Date.now(),
    };
  }, [selectedDateIndex, liveMetrics, currentDayRecord]);

  const effectiveSessions: SessionRecord[] = useMemo(() => {
    if (selectedDateIndex === 0) {
      return sessions;
    }
    const targetDate = currentDayRecord.date;
    return sessions.filter((s) => new Date(s.startTime).toISOString().slice(0, 10) === targetDate);
  }, [selectedDateIndex, sessions, currentDayRecord]);

  const healthMetrics: HealthMonitorMetric[] = useMemo(() => {
    return generateHealthMonitorMetrics(
      effectiveMetrics.currentHrv,
      effectiveMetrics.restingHr,
      effectiveMetrics.respiratoryRate,
      settings
    );
  }, [effectiveMetrics.currentHrv, effectiveMetrics.restingHr, effectiveMetrics.respiratoryRate, settings]);

  const sleepData: SleepMetrics = useMemo(() => {
    return generateSleepMetrics(effectiveMetrics.sleepPerformance);
  }, [effectiveMetrics.sleepPerformance]);

  const zones = biometricEngine.getZones();
  const maxDayIndex = Math.min(6, daysHistory.length - 1);

  return (
    <div className="min-h-screen bg-[#0B0D10] text-white flex justify-center font-sans antialiased selection:bg-[#0093E9] selection:text-black">
      {/* Mobile Shell Container with subtle top atmospheric gradient */}
      <div className="w-full max-w-[430px] min-h-dvh bg-gradient-to-b from-[#161B22] via-[#0B0D10] to-[#000000] flex flex-col relative border-x border-white/5 shadow-2xl">
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
          selectedDate={currentDayRecord.label}
          onPrevDate={() => setSelectedDateIndex((prev) => (prev < maxDayIndex ? prev + 1 : prev))}
          onNextDate={() => setSelectedDateIndex((prev) => (prev > 0 ? prev - 1 : prev))}
        />

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
                  onSelectSubTab={setHomeSubTab}
                  onSwitchToHealthTab={() => setMainTab('health')}
                  onStartActivity={() => handleStartWorkout('Running')}
                  onLogSleep={() => setIsOledNightLockOpen(true)}
                />
              )}

              {homeSubTab === 'sleep' && (
                <SleepView
                  metrics={effectiveMetrics}
                  sleepData={sleepData}
                  onActivateOledNightLock={() => setIsOledNightLockOpen(true)}
                />
              )}

              {homeSubTab === 'recovery' && (
                <RecoveryView
                  metrics={effectiveMetrics}
                  settings={settings}
                  onOpenRecoveryTest={() => setIsRecoveryTestOpen(true)}
                />
              )}

              {homeSubTab === 'strain' && (
                <StrainView
                  metrics={effectiveMetrics}
                  zones={zones}
                  settings={settings}
                  onStartWorkout={handleStartWorkout}
                  onStopWorkout={handleStopWorkout}
                  isWorkoutActive={isWorkoutActive}
                  workoutElapsedSec={workoutElapsedSec}
                />
              )}
            </>
          )}

          {/* TAB 2: HEALTH (ECG waveform, Stress Monitor, Healthspan WHOOP Age) */}
          {mainTab === 'health' && (
            <HealthView
              metrics={effectiveMetrics}
              healthMetrics={healthMetrics}
              settings={settings}
              metadata={metadata}
            />
          )}

          {/* TAB 3: STRAP (Hardware Specs, Real Battery, Poincaré Scatter Plot, Raw Sniffer) */}
          {mainTab === 'strap' && (
            <StrapLabView
              metadata={metadata}
              services={services}
              packets={packets}
              onConnectBle={handleConnectBle}
              onDisconnectBle={handleDisconnectBle}
              onClearPackets={() => setPackets([])}
              onRefreshGattTree={() => whoopBleEngine.scanFullGattTree()}
            />
          )}

          {/* TAB 4: MORE (Profile, Baselines, Real CSV/JSON Export, Clear Data) */}
          {mainTab === 'more' && (
            <MoreView
              settings={settings}
              sessions={effectiveSessions}
              onSaveSettings={handleSaveSettings}
              onResetDayCounters={handleResetDayCounters}
              onRefreshSessions={refreshSessions}
            />
          )}
        </main>

        {/* Floating Action Button (+) */}
        <button
          onClick={() => setIsQuickActionOpen(true)}
          className="w-14 h-14 rounded-full bg-white text-black shadow-2xl fixed bottom-24 right-5 z-40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          title="Start Live Workout or Sleep"
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
            if (action === 'activity') handleStartWorkout('Running');
            if (action === 'sleep') setIsOledNightLockOpen(true);
            if (action === 'recovery_test') setIsRecoveryTestOpen(true);
          }}
        />

        {/* Real WHOOP 4.0 Strap Connection Bottom Sheet Modal */}
        <StrapConnectSheet
          isOpen={isStrapSheetOpen}
          onClose={() => setIsStrapSheetOpen(false)}
          metadata={metadata}
          onConnectBle={handleConnectBle}
          onDisconnectBle={handleDisconnectBle}
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
        />

        {/* OLED Night Lock Overlay */}
        <OledSleepOverlay
          isOpen={isOledNightLockOpen}
          onClose={() => setIsOledNightLockOpen(false)}
          metrics={effectiveMetrics}
          metadata={metadata}
        />
      </div>
    </div>
  );
};

export default App;
