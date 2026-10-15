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
import { whoopBLE } from './services/WhoopBLEManager';
import { whoopSimulator, type SimulatorState } from './services/WhoopSimulator';
import { metricsEngine } from './services/MetricsEngine';
import { storageService, type DayHistoryRecord } from './services/StorageService';
import {
  generateHealthMonitorMetrics,
  generateSleepMetrics,
  calculateOptimalStrainTarget,
} from './utils/whoopAlgorithms';

import { WhoopTopBar } from './components/WhoopTopBar';
import { WhoopBottomNav } from './components/WhoopBottomNav';
import { OverviewView } from './components/views/OverviewView';
import { StrainView } from './components/views/StrainView';
import { RecoveryView } from './components/views/RecoveryView';
import { SleepView } from './components/views/SleepView';
import { CoachingView } from './components/views/CoachingView';
import { StrapLabView } from './components/views/StrapLabView';
import { MoreView } from './components/views/MoreView';
import { OledSleepOverlay } from './components/views/OledSleepOverlay';
import { RecoveryTestModal } from './components/RecoveryTestModal';
import { QuickActionModal } from './components/QuickActionModal';
import { StrapConnectSheet } from './components/StrapConnectSheet';
import { WorkoutHudModal } from './components/views/WorkoutHudModal';

import { AlertCircle, X } from 'lucide-react';

export const App: React.FC = () => {
  // --- User Settings & Biometrics ---
  const [settings, setSettings] = useState<UserSettings>(() => {
    const s = storageService.getUserSettings();
    return {
      ...s,
      sleepNeedHours: 7.9,
    };
  });

  // --- Navigation States ---
  const [mainTab, setMainTab] = useState<MainTabType>('home');
  const [homeSubTab, setHomeSubTab] = useState<HomeSubTab>('overview');
  const [selectedDateIndex, setSelectedDateIndex] = useState(0); // 0 = TODAY, 1 = YESTERDAY, 2 = 2 DAYS AGO...

  // --- 7-Day History Records from Storage ---
  const [daysHistory, setDaysHistory] = useState<DayHistoryRecord[]>(() =>
    storageService.getDaysHistory()
  );

  // --- Modal States ---
  const [isStrapSheetOpen, setIsStrapSheetOpen] = useState(false);
  const [isWorkoutHudOpen, setIsWorkoutHudOpen] = useState(false);
  const [isRecoveryTestOpen, setIsRecoveryTestOpen] = useState(false);
  const [isOledNightLockOpen, setIsOledNightLockOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- Live BLE & Simulator States ---
  const [metadata, setMetadata] = useState<DeviceMetadata>(() => whoopBLE.getMetadata());
  const [isSimulator, setIsSimulator] = useState<boolean>(true); // Pre-enabled for immediate out-of-the-box exploration
  const [simulatorMode, setSimulatorMode] = useState<SimulatorState>('resting');

  // --- Live Metrics State (for Today) ---
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>(() => ({
    currentHr: 62,
    currentHrv: settings.hrvBaseline,
    sdnn: Math.round(settings.hrvBaseline * 1.1),
    meanRR: 880,
    minHr: 52,
    maxHr: 84,
    avgHr: 64,
    restingHr: settings.restingHrBaseline,
    dailyStrain: 6.8,
    recoveryScore: 78,
    recoveryCategory: 'green',
    sleepPerformance: 98,
    activeCalories: 215,
    currentZone: 1,
    zoneSeconds: { 0: 3600, 1: 520, 2: 180, 3: 0, 4: 0, 5: 0 },
    optimalStrainTarget: calculateOptimalStrainTarget(78),
    timestamp: Date.now(),
  }));

  // --- Active Workout State ---
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [workoutElapsedSec, setWorkoutElapsedSec] = useState(0);
  const [activeSportTitle, setActiveSportTitle] = useState('Running');
  const [workoutSamples, setWorkoutSamples] = useState<Array<{ timestamp: number; hr: number; hrv: number }>>([]);

  // --- Sessions & BLE Explorer Packets ---
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [services, setServices] = useState<GattServiceInfo[]>([]);
  const [packets, setPackets] = useState<RawBlePacket[]>([]);

  // Load saved sessions & packets from IndexedDB
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

  // Ingest sample from BLE or Simulator
  const handleSample = useCallback((bpm: number, rrIntervals: number[]) => {
    const updated = metricsEngine.ingestSample(bpm, rrIntervals);
    const target = calculateOptimalStrainTarget(updated.recoveryScore);

    setLiveMetrics({
      ...updated,
      sleepPerformance: 98,
      optimalStrainTarget: target,
    });

    // If workout is active, collect session samples
    if (isWorkoutActive) {
      setWorkoutSamples((prev) => [
        ...prev,
        { timestamp: Date.now(), hr: bpm, hrv: updated.currentHrv },
      ]);
    }
  }, [isWorkoutActive]);

  // BLE & Simulator event subscriptions
  useEffect(() => {
    const unsubHr = whoopBLE.onHeartRate((data) => {
      if (!isSimulator) {
        handleSample(data.bpm, data.rrIntervals);
      }
    });

    const unsubBat = whoopBLE.onBattery((level) => {
      setMetadata((prev) => ({ ...prev, batteryLevel: level }));
    });

    const unsubMeta = whoopBLE.onMetadata((meta) => {
      if (!isSimulator) {
        setMetadata(meta);
      }
    });

    const unsubPkt = whoopBLE.onPacket((pkt) => {
      setPackets((prev) => [pkt, ...prev.slice(0, 99)]);
    });

    const unsubGatt = whoopBLE.onGattTree((tree) => {
      setServices(tree);
    });

    const unsubErr = whoopBLE.onError((err) => {
      setErrorMessage(err);
    });

    const unsubSimSample = whoopSimulator.onSample((data) => {
      if (isSimulator) {
        handleSample(data.bpm, data.rrIntervals);
      }
    });

    const unsubSimState = whoopSimulator.onStateChange((running) => {
      if (running) {
        setMetadata(whoopSimulator.getSimulatedMetadata());
      }
    });

    if (isSimulator) {
      whoopSimulator.start();
      setMetadata(whoopSimulator.getSimulatedMetadata());
    }

    return () => {
      unsubHr();
      unsubBat();
      unsubMeta();
      unsubPkt();
      unsubGatt();
      unsubErr();
      unsubSimSample();
      unsubSimState();
      whoopSimulator.stop();
    };
  }, [isSimulator, handleSample]);

  // Connect BLE flow
  const handleConnectBle = async (filterByWhoop = false) => {
    try {
      setErrorMessage(null);
      if (isSimulator) {
        whoopSimulator.stop();
        setIsSimulator(false);
      }
      await whoopBLE.connect(filterByWhoop);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes('cancelled') && !msg.includes('User cancelled')) {
        setErrorMessage(msg);
      }
    }
  };

  const handleDisconnectBle = () => {
    whoopBLE.disconnect();
  };

  const handleToggleSimulator = () => {
    if (isSimulator) {
      whoopSimulator.stop();
      setIsSimulator(false);
      setMetadata(whoopBLE.getMetadata());
    } else {
      whoopBLE.disconnect();
      setIsSimulator(true);
      whoopSimulator.setMode(simulatorMode);
      whoopSimulator.start();
      setMetadata(whoopSimulator.getSimulatedMetadata());
    }
  };

  const handleSelectSimulatorMode = (mode: SimulatorState) => {
    setSimulatorMode(mode);
    if (isSimulator) {
      whoopSimulator.setMode(mode);
    }
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
    const evaluated = metricsEngine.evaluateWorkoutSession(workoutStartTime, endTime, workoutSamples);

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
    metricsEngine.updateSettings(newSettings);
  };

  const handleResetDayCounters = () => {
    metricsEngine.resetDayCounters();
    setLiveMetrics((prev) => ({
      ...prev,
      dailyStrain: 0,
      activeCalories: 0,
      zoneSeconds: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    }));
  };

  // --- Effective Metrics based on Selected Date ---
  const currentDayRecord = daysHistory[selectedDateIndex] || daysHistory[0];

  const effectiveMetrics: LiveMetrics = useMemo(() => {
    if (selectedDateIndex === 0) {
      return liveMetrics;
    }
    // For past days, present historical record snapshot
    return {
      currentHr: 0,
      currentHrv: currentDayRecord.hrv,
      sdnn: Math.round(currentDayRecord.hrv * 1.1),
      meanRR: 850,
      minHr: 48,
      maxHr: 165,
      avgHr: 65,
      restingHr: currentDayRecord.rhr,
      dailyStrain: currentDayRecord.dayStrain,
      recoveryScore: currentDayRecord.recoveryScore,
      recoveryCategory: currentDayRecord.recoveryCategory,
      sleepPerformance: currentDayRecord.sleepPerformance,
      activeCalories: currentDayRecord.activeCalories,
      currentZone: 0,
      zoneSeconds: { 0: 3600, 1: 1800, 2: 900, 3: 600, 4: 300, 5: 0 },
      optimalStrainTarget: calculateOptimalStrainTarget(currentDayRecord.recoveryScore),
      timestamp: Date.now(),
    };
  }, [selectedDateIndex, liveMetrics, currentDayRecord]);

  const effectiveSessions: SessionRecord[] = useMemo(() => {
    if (selectedDateIndex === 0) {
      return sessions.length > 0 ? sessions : currentDayRecord.sessions;
    }
    return currentDayRecord.sessions;
  }, [selectedDateIndex, sessions, currentDayRecord]);

  const healthMetrics: HealthMonitorMetric[] = useMemo(() => {
    return generateHealthMonitorMetrics(
      effectiveMetrics.currentHrv,
      effectiveMetrics.restingHr,
      settings
    );
  }, [effectiveMetrics.currentHrv, effectiveMetrics.restingHr, settings]);

  const sleepData: SleepMetrics = useMemo(() => {
    return generateSleepMetrics(effectiveMetrics.sleepPerformance);
  }, [effectiveMetrics.sleepPerformance]);

  const zones = metricsEngine.getZones();
  const maxDayIndex = Math.min(6, daysHistory.length - 1);

  return (
    <div className="min-h-screen bg-black text-white flex justify-center font-sans antialiased selection:bg-whoop-blue selection:text-black">
      {/* Mobile iPhone Shell Container */}
      <div className="w-full max-w-[430px] min-h-dvh bg-black flex flex-col relative border-x border-[#1E232D] shadow-2xl">
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
        <main className="flex-1 px-3.5 pt-3 overflow-y-auto">
          {/* TAB 1: HOME (Sub-tabs: Overview | Strain | Recovery | Sleep) */}
          {mainTab === 'home' && (
            <>
              {homeSubTab === 'overview' && (
                <OverviewView
                  metrics={effectiveMetrics}
                  healthMetrics={healthMetrics}
                  sessions={effectiveSessions}
                  settings={settings}
                  onSelectSubTab={setHomeSubTab}
                  onStartActivity={() => handleStartWorkout('Running')}
                  onLogSleep={() => setIsOledNightLockOpen(true)}
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

              {homeSubTab === 'recovery' && (
                <RecoveryView
                  metrics={effectiveMetrics}
                  settings={settings}
                  onOpenRecoveryTest={() => setIsRecoveryTestOpen(true)}
                />
              )}

              {homeSubTab === 'sleep' && (
                <SleepView
                  metrics={effectiveMetrics}
                  sleepData={sleepData}
                  onActivateOledNightLock={() => setIsOledNightLockOpen(true)}
                />
              )}
            </>
          )}

          {/* TAB 2: COACHING */}
          {mainTab === 'coaching' && (
            <CoachingView
              metrics={effectiveMetrics}
              sleepData={sleepData}
              settings={settings}
              onStartActivity={() => handleStartWorkout('Running')}
              onStartSleep={() => setIsOledNightLockOpen(true)}
            />
          )}

          {/* TAB 3: LIVE ACTIVITY */}
          {mainTab === 'activity' && (
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

          {/* TAB 4: STRAP / BLE LAB */}
          {mainTab === 'strap' && (
            <StrapLabView
              metadata={metadata}
              services={services}
              packets={packets}
              isSimulator={isSimulator}
              onConnectBle={handleConnectBle}
              onDisconnectBle={handleDisconnectBle}
              onToggleSimulator={handleToggleSimulator}
              onClearPackets={() => setPackets([])}
              onRefreshGattTree={() => whoopBLE.scanFullGattTree()}
            />
          )}

          {/* TAB 5: MORE / SETTINGS */}
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

        {/* Bottom Navigation Bar */}
        <WhoopBottomNav
          activeTab={mainTab}
          onChangeTab={setMainTab}
          onOpenQuickAction={() => setIsQuickActionOpen(true)}
          packetCount={packets.length}
        />

        {/* Quick Action Modal (Plus Button) */}
        <QuickActionModal
          isOpen={isQuickActionOpen}
          onClose={() => setIsQuickActionOpen(false)}
          onSelectAction={(action) => {
            if (action === 'activity') handleStartWorkout('Running');
            if (action === 'sleep') setIsOledNightLockOpen(true);
            if (action === 'recovery_test') setIsRecoveryTestOpen(true);
          }}
        />

        {/* WHOOP 4.0 Strap Connection Bottom Sheet Modal */}
        <StrapConnectSheet
          isOpen={isStrapSheetOpen}
          onClose={() => setIsStrapSheetOpen(false)}
          metadata={metadata}
          isSimulator={isSimulator}
          simulatorMode={simulatorMode}
          onConnectBle={handleConnectBle}
          onDisconnectBle={handleDisconnectBle}
          onToggleSimulator={handleToggleSimulator}
          onSelectSimulatorMode={handleSelectSimulatorMode}
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
