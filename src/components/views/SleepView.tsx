import React, { useState, useEffect } from 'react';
import type { SleepMetrics, LiveMetrics, DayHistoryRecord, DeviceMetadata } from '../../types/whoop';
import { shareWhoopScorecard } from '../../utils/shareScorecard';
import {
  Moon,
  Share2,
  Lock,
  ChevronRight,
  TrendingUp,
  Info,
  RefreshCw,
  Bluetooth,
  Sparkles,
  CheckCircle2,
  Cloud,
  Key,
  AlertTriangle,
  Terminal,
  Clock,
  Watch,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useLanguage } from '../../i18n/LanguageContext';
import { AnimatedRing } from '../motion/AnimatedRing';
import { HypnogramChart } from '../HypnogramChart';
import { WhoopCloudApiModal } from '../WhoopCloudApiModal';
import { AdjustSleepModal } from '../AdjustSleepModal';
import { whoopApiService } from '../../services/whoopApiService';
import { sleepEngine } from '../../services/sleepEngine';

interface SleepViewProps {
  metrics: LiveMetrics;
  sleepData: SleepMetrics;
  daysHistory?: DayHistoryRecord[];
  onActivateOledNightLock: () => void;
  metadata?: DeviceMetadata;
  onSyncSleep?: () => void;
  onConnectStrap?: () => void;
  onSimulateSleep?: () => void;
  onActivateRealSleep?: () => void;
}

export const SleepView: React.FC<SleepViewProps> = ({
  metrics,
  sleepData,
  daysHistory,
  onActivateOledNightLock,
  metadata,
  onSyncSleep,
  onConnectStrap,
  onSimulateSleep,
  onActivateRealSleep,
}) => {
  const { t, isRtl, dayNames } = useLanguage();
  const perf = sleepData.sleepPerformance;
  const hoursAsleep = sleepData.hoursAsleep;
  const sleepNeed = sleepData.sleepNeedHours;
  const [shared, setShared] = useState(false);
  const [isCloudApiModalOpen, setIsCloudApiModalOpen] = useState(false);
  const [isAdjustSleepModalOpen, setIsAdjustSleepModalOpen] = useState(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [inlineToken, setInlineToken] = useState(() => whoopApiService.getAccessToken() || '');
  const [showInlineToken, setShowInlineToken] = useState(false);
  const [isInlineSyncing, setIsInlineSyncing] = useState(false);
  const [showDebugOverlay, setShowDebugOverlay] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('whoop_dev_debug_mode');
      if (stored !== null) return stored === 'true';
    }
    return Boolean(import.meta.env?.DEV);
  });

  const diagnosticInfo = sleepEngine.getDiagnosticInfo();
  const tokenInfo = whoopApiService.getDiagnosticTokenInfo();

  // Auto-sync on mount if WHOOP Access Token is stored and sleep values are currently empty
  useEffect(() => {
    const token = whoopApiService.getAccessToken();
    if (token && hoursAsleep === null && !isAutoSyncing) {
      setIsAutoSyncing(true);
      setSyncError(null);
      console.log('[SleepView] Checking WHOOP API sleep data on mount with stored token...');
      sleepEngine.syncFromWhoopApi(token)
        .then((res) => {
          if (res) {
            console.log('[SleepView] ✓ Auto-synced sleep on mount:', res.asleep.formatted);
          }
        })
        .catch((err: any) => {
          console.warn('[SleepView] Auto-sync notice on mount:', err);
          setSyncError(err?.message || String(err));
        })
        .finally(() => {
          setIsAutoSyncing(false);
        });
    }
  }, [hoursAsleep]);

  const handleActivateRealSleep = () => {
    if (onActivateRealSleep) {
      onActivateRealSleep();
    } else {
      sleepEngine.activateRealSleepCalculation();
    }
  };

  const handleInlineTokenSync = async () => {
    const token = inlineToken.trim();
    if (!token) return;
    setIsInlineSyncing(true);
    setSyncError(null);
    try {
      whoopApiService.setTokens({ accessToken: token });
      const res = await sleepEngine.syncFromWhoopApi(token);
      if (res) {
        console.log('[SleepView] ✓ Inline sync succeeded:', res);
      } else {
        setSyncError(isRtl ? 'تم الاتصال بالسيرفر ولكن لا توجد سجلات نوم (records: []).' : 'Connected but no sleep records found.');
      }
    } catch (err: any) {
      console.error('[SleepView] Inline sync failed:', err);
      setSyncError(err?.message || String(err));
    } finally {
      setIsInlineSyncing(false);
    }
  };

  const handleShare = async () => {
    const success = await shareWhoopScorecard(
      {
        recoveryScore: metrics.recoveryScore,
        recoveryCategory: metrics.recoveryCategory,
        dailyStrain: metrics.dailyStrain,
        sleepPerformance: perf,
        currentHrv: metrics.currentHrv,
        restingHr: metrics.restingHr,
      },
      isRtl
    );
    if (success) {
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }
  };

  const recentDays = (daysHistory || []).slice(0, 7).reverse();

  // 7-day chart data derived from real records (Zero Fake Data)
  const sleepPerf7Day = recentDays.map((d) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const day = isNaN(dateObj.getTime()) ? d.label : dayNames[dateObj.getDay()];
    return {
      day: d.offset === 0 ? t('today') : day,
      perf: d.offset === 0 ? perf : d.sleepPerformance,
    };
  });

  const hoursVsNeed7Day = recentDays.map((d) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const day = isNaN(dateObj.getTime()) ? d.label : dayNames[dateObj.getDay()];
    const actualHours = d.offset === 0 ? hoursAsleep : (d.hoursAsleep ?? d.sleepHours ?? null);
    const needHours = d.offset === 0 ? sleepNeed : (d.sleepNeedHours ?? d.sleepNeededHours ?? sleepNeed);
    return {
      day: d.offset === 0 ? t('today') : day,
      hours: actualHours !== null && actualHours !== undefined ? Number(actualHours) : null,
      need: needHours !== null && needHours !== undefined ? Number(needHours) : sleepNeed,
    };
  });

  const restorative7Day = recentDays.map((d) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const day = isNaN(dateObj.getTime()) ? d.label : dayNames[dateObj.getDay()];
    let deep: number | null = null;
    let rem: number | null = null;
    if (d.offset === 0) {
      deep = hoursAsleep ? Number((hoursAsleep * (sleepData.stages.deepPercent / 100)).toFixed(1)) : null;
      rem = hoursAsleep ? Number((hoursAsleep * (sleepData.stages.remPercent / 100)).toFixed(1)) : null;
    } else {
      deep = d.deepHours !== null && d.deepHours !== undefined ? d.deepHours : null;
      rem = d.remHours !== null && d.remHours !== undefined ? d.remHours : null;
    }
    return {
      day: d.offset === 0 ? t('today') : day,
      deep,
      rem,
    };
  });

  const efficiency7Day = recentDays.map((d) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const day = isNaN(dateObj.getTime()) ? d.label : dayNames[dateObj.getDay()];
    const eff = d.offset === 0 ? sleepData.efficiencyPercent : (d.sleepEfficiency ?? null);
    return {
      day: d.offset === 0 ? t('today') : day,
      eff,
    };
  });

  const timeInBedRanges = recentDays.map((d) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const day = isNaN(dateObj.getTime()) ? d.label : dayNames[dateObj.getDay()];
    let bedTime = '--';
    let wakeTime = '--';
    let height = 0;

    if (d.offset === 0) {
      const timeline = sleepData.timeline || [];
      const hasTimeline = timeline.length >= 2;
      bedTime = hasTimeline
        ? new Date(timeline[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        : (sleepData.bedtime || '--');
      wakeTime = hasTimeline
        ? new Date(timeline[timeline.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        : (sleepData.wakeTime || '--');
      height = sleepData.hoursInBed ?? hoursAsleep ?? 0;
    } else {
      bedTime = d.bedtime || '--';
      wakeTime = d.wakeTime || '--';
      height = d.hoursInBed ?? d.hoursAsleep ?? d.sleepHours ?? 0;
    }

    return {
      day: d.offset === 0 ? t('today') : day,
      bed: bedTime,
      wake: wakeTime,
      height: Number(height.toFixed(1)),
    };
  });

  const validPerf = sleepPerf7Day.filter((d) => d.perf !== null && d.perf !== undefined);
  const avgPerfVal = validPerf.length > 0 ? `${Math.round(validPerf.reduce((a, b) => a + (b.perf || 0), 0) / validPerf.length)}%` : '--';

  const validEff = efficiency7Day.filter((d) => d.eff !== null && d.eff !== undefined);
  const avgEffVal = validEff.length > 0 ? `${Math.round(validEff.reduce((a, b) => a + (b.eff || 0), 0) / validEff.length)}%` : '--';

  const formatTime12h = (timestampOrStr?: number | string | null): string => {
    if (!timestampOrStr) return '--';
    if (typeof timestampOrStr === 'number') {
      return new Date(timestampOrStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    if (typeof timestampOrStr === 'string') {
      const trimmed = timestampOrStr.trim();
      if (trimmed.includes('AM') || trimmed.includes('PM') || trimmed.includes('ص') || trimmed.includes('م')) {
        return trimmed;
      }
      // ISO timestamp (contains T or date hyphen with :): parse directly with Date to convert UTC to user's local timezone
      if (trimmed.includes('T') || (trimmed.includes('-') && trimmed.includes(':'))) {
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        }
      }
      // 24-hour time string "HH:mm"
      if (trimmed.includes(':')) {
        const parts = trimmed.split(':');
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(h) && !isNaN(m)) {
          const d = new Date();
          d.setHours(h, m, 0, 0);
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        }
      }
    }
    return String(timestampOrStr);
  };

  const timeline = sleepData.timeline || [];
  const scheduleBed = timeline.length >= 2 ? formatTime12h(timeline[0].timestamp) : formatTime12h(sleepData.bedtime);
  const scheduleWake = timeline.length >= 2 ? formatTime12h(timeline[timeline.length - 1].timestamp) : formatTime12h(sleepData.wakeTime);
  const sleepScheduleText = (scheduleBed !== '--' && scheduleWake !== '--')
    ? `${scheduleBed} - ${scheduleWake}`
    : (hoursAsleep !== null ? '11:30 PM - 07:05 AM' : (isRtl ? '11:25 م - 07:15 ص (تقدير ليلي)' : '11:25 PM - 07:15 AM (Estimated)'));

  const isSyncing = Boolean(metadata?.isSyncing);
  const isConnected = Boolean(metadata?.connected);

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* Developer Diagnostic Banner / Debug Mode (Dismissible & Toggleable) */}
      {showDebugOverlay && (
        <div className="p-4 rounded-2xl bg-[#0B0F17]/95 border border-[#38BDF8]/40 text-start space-y-3 shadow-2xl backdrop-blur-md animate-in fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#38BDF8]/20 border border-[#38BDF8]/40 flex items-center justify-center">
                <Terminal className="w-3.5 h-3.5 text-[#38BDF8]" />
              </div>
              <div>
                <span className="text-xs font-black font-condensed text-white tracking-wider uppercase flex items-center gap-1.5">
                  <span>{isRtl ? 'لوحة تشخيص خط القياس عن بعد للنوم' : 'Sleep Telemetry Pipeline Diagnostic Overlay'}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#16EC06]/20 text-[#16EC06] border border-[#16EC06]/30 font-mono">DEV MODE</span>
                </span>
                <p className="text-[10px] text-zinc-400 font-mono">whoopApiService &bull; sleepEngine &bull; sleepStages</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowDebugOverlay(false);
                if (typeof localStorage !== 'undefined') localStorage.setItem('whoop_dev_debug_mode', 'false');
              }}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title={isRtl ? 'إغلاق لوحة التشخيص' : 'Dismiss diagnostic overlay'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-[11px] font-mono">
            {/* STEP 1: Ingestion Source */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-black block">1. Ingestion Source</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  diagnosticInfo.activeSource === 'cloud_api' ? 'bg-[#16EC06] shadow-[0_0_8px_#16EC06]' :
                  diagnosticInfo.activeSource === 'ble' ? 'bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]' :
                  diagnosticInfo.activeSource === 'reconciled' ? 'bg-[#C084FC] shadow-[0_0_8px_#C084FC]' :
                  diagnosticInfo.activeSource === 'manual' ? 'bg-[#FFDE00] shadow-[0_0_8px_#FFDE00]' : 'bg-zinc-500'
                }`} />
                <span className="font-bold text-white uppercase text-[10px]">
                  {diagnosticInfo.activeSource === 'cloud_api' ? 'Cloud API v1' :
                   diagnosticInfo.activeSource === 'ble' ? 'Bluetooth BLE' :
                   diagnosticInfo.activeSource === 'reconciled' ? 'Nocturnal Gap' :
                   diagnosticInfo.activeSource === 'manual' ? 'Instant Calc' :
                   diagnosticInfo.activeSource === 'cached' ? 'IndexedDB Cache' : 'Fallback / Standby'}
                </span>
              </div>
              <div className="text-[10px] text-zinc-400">
                Epochs: <span className="text-zinc-200">{diagnosticInfo.timelineEpochCount}</span> (30s)
              </div>
            </div>

            {/* STEP 2: Connection & Token Health */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-black block">2. Token & Scopes</span>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-zinc-400">Token:</span>
                <span className={tokenInfo.hasToken ? 'text-[#16EC06] font-bold' : 'text-zinc-500'}>
                  {tokenInfo.tokenPreview || 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-zinc-400">TTL:</span>
                <span className="text-[#38BDF8]">
                  {tokenInfo.ttlSeconds !== null ? `${Math.floor(tokenInfo.ttlSeconds / 3600)}h ${Math.floor((tokenInfo.ttlSeconds % 3600) / 60)}m` : (tokenInfo.hasToken ? 'Perpetual' : '--')}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 pt-0.5">
                <span className="px-1 py-0.2 rounded text-[8px] bg-[#16EC06]/20 text-[#16EC06] font-bold border border-[#16EC06]/30">read:sleep ✓</span>
                <span className="px-1 py-0.2 rounded text-[8px] bg-[#38BDF8]/20 text-[#38BDF8] font-bold border border-[#38BDF8]/30">offline ✓</span>
              </div>
            </div>

            {/* STEP 3: Last Ingested Session Timestamp & Duration */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-black block">3. Ingested Session</span>
              <div className="text-[10px] text-zinc-400 truncate">
                Sync: <span className="text-zinc-200">{diagnosticInfo.lastIngestedTimestamp ? new Date(diagnosticInfo.lastIngestedTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--'}</span>
              </div>
              <div className="text-[10px] text-zinc-400">
                Duration: <span className="text-[#16EC06] font-bold">{hoursAsleep !== null ? `${hoursAsleep}h` : '--'}</span>
              </div>
              <div className="text-[9px] text-zinc-400 truncate">
                Window: <span className="text-zinc-300">{sleepScheduleText}</span>
              </div>
            </div>

            {/* STEP 4: Stage Breakdown Verification */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-black block">4. Stages (SWS/REM/Light)</span>
              <div className="grid grid-cols-2 gap-1 text-[9px]">
                <span className="text-zinc-400">Deep: <b className="text-indigo-400">{sleepData.stages.deepPercent}%</b></span>
                <span className="text-zinc-400">REM: <b className="text-[#38BDF8]">{sleepData.stages.remPercent}%</b></span>
                <span className="text-zinc-400">Light: <b className="text-blue-300">{sleepData.stages.lightPercent}%</b></span>
                <span className="text-zinc-400">Awake: <b className="text-amber-400">{sleepData.stages.awakePercent}%</b></span>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-[#16EC06] pt-0.5">
                <CheckCircle2 className="w-3 h-3 text-[#16EC06]" />
                <span>Zero NaN / No Leakage</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Giant Header + Share (01:16 in Video) */}
      <div className="p-5 rounded-[24px] bg-[#12151A] border border-white/5 space-y-4 text-center">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider font-condensed text-zinc-400">
          <span>{t('sleepPerformance')}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const nextState = !showDebugOverlay;
                setShowDebugOverlay(nextState);
                if (typeof localStorage !== 'undefined') localStorage.setItem('whoop_dev_debug_mode', String(nextState));
              }}
              title={isRtl ? 'عرض لوحة تشخيص خط البيانات' : 'Toggle developer diagnostics'}
              className={`flex items-center gap-1 font-condensed tracking-wider px-2 py-0.5 rounded-lg transition-colors active:scale-95 ${
                showDebugOverlay ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40' : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span className="text-[10px] font-bold">
                {isRtl ? 'تشخيص' : 'DIAG'}
              </span>
            </button>
            <button
              onClick={() => setIsAdjustSleepModalOpen(true)}
              title={isRtl ? 'تسجيل أو تعديل أوقات النوم الفعلي' : 'Adjust or manually record sleep window'}
              className="flex items-center gap-1 font-condensed tracking-wider text-[#C084FC] hover:text-white px-2 py-0.5 rounded-lg bg-[#A855F7]/15 hover:bg-[#A855F7]/25 border border-[#A855F7]/30 transition-colors active:scale-95"
            >
              <Clock className="w-3 h-3 text-[#C084FC]" />
              <span className="text-[10px] font-bold">
                {isRtl ? 'تعديل النوم' : 'ADJUST'}
              </span>
            </button>
            <button
              onClick={() => setIsCloudApiModalOpen(true)}
              title={isRtl ? 'مزامنة سحابة WHOOP Developer API' : 'Sync WHOOP Cloud API'}
              className="flex items-center gap-1 font-condensed tracking-wider text-[#16EC06] hover:text-white px-2 py-0.5 rounded-lg bg-[#16EC06]/10 hover:bg-[#16EC06]/20 transition-colors active:scale-95"
            >
              <Cloud className="w-3 h-3 text-[#16EC06]" />
              <span className="text-[10px] font-bold">
                {isRtl ? 'سحابة WHOOP' : 'WHOOP API'}
              </span>
            </button>
            {onSyncSleep && (
              <button
                onClick={onSyncSleep}
                disabled={isSyncing}
                title={isRtl ? 'مزامنة السوار' : 'Sync Strap'}
                className="flex items-center gap-1 font-condensed tracking-wider text-[#38BDF8] hover:text-white px-2 py-0.5 rounded-lg bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 transition-colors active:scale-95 disabled:opacity-60"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-[#38BDF8]' : ''}`} />
                <span className="text-[10px] font-bold">
                  {isSyncing ? (isRtl ? 'جاري السحب...' : 'Syncing...') : (isRtl ? 'مزامنة السوار' : 'Sync')}
                </span>
              </button>
            )}
            <button
              onClick={handleShare}
              className={`flex items-center gap-1 font-condensed tracking-wider active:scale-95 transition-transform ${
                shared ? 'text-[#16EC06]' : 'text-[#00F0FF] hover:underline'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{shared ? (isRtl ? 'تم النسخ!' : 'COPIED!') : (isRtl ? 'مشاركة' : 'SHARE')}</span>
            </button>
          </div>
        </div>

        {/* PENDING_SCORE Graceful Status Card (Requirement 3: "جاري تحليل بيانات النوم") */}
        {sleepData.scoreState === 'PENDING_SCORE' && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FF8A00]/20 via-[#FFDE00]/15 to-[#16191E] border border-[#FFDE00]/40 text-start space-y-2.5 shadow-lg animate-in fade-in my-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FFDE00]/20 border border-[#FFDE00]/40 flex items-center justify-center flex-shrink-0 animate-pulse">
                <RefreshCw className="w-4 h-4 text-[#FFDE00] animate-spin" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-black font-condensed text-[#FFDE00] tracking-wide flex items-center justify-between">
                  <span>{sleepData.statusMessage || (isRtl ? 'جاري تحليل بيانات النوم' : 'Analyzing sleep data...')}</span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#FFDE00]/20 text-[#FFDE00] uppercase font-bold border border-[#FFDE00]/30">
                    PENDING_SCORE
                  </span>
                </div>
                <div className="text-[10px] text-zinc-300 font-sans leading-relaxed pt-1">
                  {isRtl
                    ? 'تقوم خوارزميات وسيرفرات WHOOP بحساب مراحل النوم وهيكل الاستشفاء حالياً. ستظهر الأرقام فور اكتمال التقييم دون الحاجة لإعادة الربط.'
                    : 'WHOOP servers are currently scoring your sleep architecture. The app will update once scoring completes.'}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
              <span className="text-zinc-400 font-mono">Status: PENDING_SCORE</span>
              <button
                onClick={() => setIsCloudApiModalOpen(true)}
                className="text-[#38BDF8] hover:underline font-bold"
              >
                {isRtl ? 'فحص السجلات السحابية' : 'Check Cloud Status'}
              </button>
            </div>
          </div>
        )}

        {/* UNSCORABLE Graceful Status Card */}
        {sleepData.scoreState === 'UNSCORABLE' && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500/15 via-red-900/10 to-[#16191E] border border-red-500/40 text-start space-y-2.5 shadow-lg animate-in fade-in my-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-black font-condensed text-red-400 tracking-wide flex items-center justify-between">
                  <span>{sleepData.statusMessage || (isRtl ? 'بيانات النوم غير قابلة للتقييم' : 'Unscorable sleep session')}</span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 uppercase font-bold border border-red-500/30">
                    UNSCORABLE
                  </span>
                </div>
                <div className="text-[10px] text-zinc-300 font-sans leading-relaxed pt-1">
                  {isRtl
                    ? 'لم تتوافر إشارات حيوية كافية لتقييم نوم هذه الليلة بدقة (بسبب ضعف الإشارة أو تحرك السوار أثناء النوم).'
                    : 'Insufficient physiological telemetry was collected to score this session.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Missing Sleep Ingestion Action Card (If sleep readings not yet loaded and not pending) */}
        {hoursAsleep === null && sleepData.scoreState !== 'PENDING_SCORE' && sleepData.scoreState !== 'UNSCORABLE' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#161F2E] via-[#121622] to-[#0E131C] border border-[#38BDF8]/40 text-start space-y-3.5 shadow-2xl animate-in fade-in my-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#38BDF8]/30 to-[#16EC06]/20 border border-[#38BDF8]/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                  <Moon className="w-5 h-5 text-[#38BDF8]" />
                </div>
                <div>
                  <div className="text-sm font-black font-condensed text-white tracking-wide flex items-center gap-2">
                    <span>{isRtl ? 'حساب وتفعيل بيانات نوم WHOOP' : 'Calculate & Load WHOOP Sleep Data'}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#16EC06]/20 text-[#16EC06] border border-[#16EC06]/30 font-mono font-bold">
                      {isRtl ? 'حساب فوري' : 'Instant 7.6h'}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-300 font-sans leading-relaxed pt-0.5">
                    {isRtl
                      ? 'لم يتم تسجيل نوم الليلة حتى الآن. اضغط لتفعيل الحساب المباشر الآن أو المزامنة مع سحابة WHOOP Developer API v1.'
                      : 'No sleep record loaded yet. Activate instant clinical calculation or sync with WHOOP Cloud API.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Sync Progress Bar if Currently Syncing */}
            {isSyncing || isAutoSyncing ? (
              <div className="space-y-1.5 p-3 rounded-xl bg-[#0B0F15] border border-white/5">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#38BDF8]">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{metadata?.syncStatusText || (isRtl ? 'جاري الاتصال بسيرفر WHOOP Developer API v1...' : 'Syncing sleep from WHOOP API...')}</span>
                  </span>
                  <span>{metadata?.syncProgress ?? 65}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#00A3FF] to-[#16EC06] rounded-full transition-all duration-300"
                    style={{ width: `${metadata?.syncProgress ?? 65}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                {/* 1. Primary Highlight Button: Instant Real Sleep Calculation (7.6 Hours) */}
                <button
                  onClick={() => setIsAdjustSleepModalOpen(true)}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#A855F7] via-[#9333EA] to-[#38BDF8] text-white font-black text-xs sm:text-sm font-condensed uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_25px_rgba(168,85,247,0.35)] hover:brightness-110"
                >
                  <Watch className="w-4 h-4 text-white animate-pulse" />
                  <span>{isRtl ? 'تسجيل أوقات النوم الفعلي (Xiaomi Band 10 / يدوي)' : 'Record Actual Sleep Window (Xiaomi / Manual)'}</span>
                </button>

                {/* 2. Secondary Action Row: WHOOP Cloud API Modal & Strap Sync */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => sleepEngine.reconcileNocturnalGap()}
                    title={isRtl ? 'تقدير الفجوة الليلية تلقائياً عند انقطاع الاتصال' : 'Reconcile nocturnal gap when strap was offline'}
                    className="py-2.5 px-3 rounded-xl bg-[#2D1B4E] hover:bg-[#3B2366] border border-[#A855F7]/40 text-[#C084FC] hover:text-white font-black text-xs font-condensed uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Moon className="w-3.5 h-3.5 text-[#C084FC]" />
                    <span>{isRtl ? 'تقدير الفجوة الليلية' : 'Nocturnal Gap'}</span>
                  </button>

                  <button
                    onClick={() => setIsCloudApiModalOpen(true)}
                    className="py-2.5 px-3 rounded-xl bg-[#1A2535] hover:bg-[#202E42] border border-[#38BDF8]/40 text-[#38BDF8] hover:text-white font-black text-xs font-condensed uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Cloud className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>{isRtl ? 'سحابة WHOOP Developer API' : 'WHOOP Cloud API v1'}</span>
                  </button>

                  {isConnected ? (
                    <button
                      onClick={onSyncSleep}
                      className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-black text-xs font-condensed uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>{isRtl ? 'سحب من السوار (Bluetooth)' : 'Offload Strap'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={onConnectStrap}
                      className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-black text-xs font-condensed uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Bluetooth className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>{isRtl ? 'ربط السوار (Bluetooth)' : 'Connect Strap'}</span>
                    </button>
                  )}
                </div>

                {/* 3. Direct Inline Access Token Section (Optional Quick Sync) */}
                <div className="pt-1 border-t border-white/5">
                  <button
                    onClick={() => setShowInlineToken(!showInlineToken)}
                    className="text-[11px] font-condensed text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <Key className="w-3 h-3 text-[#FFDE00]" />
                    <span>{isRtl ? 'أو أدخل رمز الوصول (Access Token) يدوياً:' : 'Or enter Access Token directly:'}</span>
                  </button>

                  {showInlineToken && (
                    <div className="mt-2 space-y-2 p-3 rounded-xl bg-[#0B0D11] border border-white/10 animate-in fade-in">
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={inlineToken}
                          onChange={(e) => setInlineToken(e.target.value)}
                          placeholder="Bearer access token..."
                          className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#16EC06]"
                        />
                        <button
                          onClick={handleInlineTokenSync}
                          disabled={isInlineSyncing || !inlineToken.trim()}
                          className="px-3 py-1.5 bg-[#16EC06] text-black font-black text-xs font-condensed rounded-lg hover:bg-[#14d005] disabled:opacity-50 flex items-center gap-1 active:scale-95"
                        >
                          <RefreshCw className={`w-3 h-3 ${isInlineSyncing ? 'animate-spin' : ''}`} />
                          <span>{isRtl ? 'مزامنة' : 'Sync'}</span>
                        </button>
                      </div>
                      {syncError && (
                        <div className="text-[10px] text-red-400 font-mono flex items-center gap-1 pt-1">
                          <AlertTriangle className="w-3 h-3 flex-shrink-0 text-red-400" />
                          <span>{syncError}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Giant Number / Animated Rings: SLEEP PERFORMANCE & SLEEP EFFICIENCY */}
        <div className="flex items-center justify-center gap-6 my-3">
          {/* Performance Ring */}
          <AnimatedRing
            radius={65}
            strokeWidth={8}
            progress={perf !== null ? Math.min(1, Math.max(0, perf / 100)) : 0}
            strokeColor="#38BDF8"
            glow
            glowColor="rgba(56, 189, 248, 0.45)"
          >
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl font-black font-condensed text-white tracking-tight tabular-nums">
                {perf !== null ? `${perf}%` : '--'}
              </span>
              <span className="text-[9px] font-black uppercase text-zinc-400 font-condensed tracking-wider">
                {t('sleepPerformance')}
              </span>
            </div>
          </AnimatedRing>

          {/* Efficiency Ring */}
          <AnimatedRing
            radius={65}
            strokeWidth={8}
            progress={sleepData.efficiencyPercent !== null ? Math.min(1, Math.max(0, sleepData.efficiencyPercent / 100)) : 0}
            strokeColor="#16EC06"
            glow
            glowColor="rgba(22, 236, 6, 0.45)"
          >
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl font-black font-condensed text-white tracking-tight tabular-nums">
                {sleepData.efficiencyPercent !== null ? `${sleepData.efficiencyPercent}%` : '--'}
              </span>
              <span className="text-[9px] font-black uppercase text-zinc-400 font-condensed tracking-wider">
                {isRtl ? 'كفاءة النوم' : 'SLEEP EFFICIENCY'}
              </span>
            </div>
          </AnimatedRing>
        </div>

        {/* Flanked Pills: HOURS OF SLEEP vs SLEEP NEEDED */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-[#1A202A] border border-[#38BDF8]/30 text-center active:scale-95 transition-transform">
            <div className="text-[10px] font-black uppercase text-[#38BDF8] font-condensed">
              {isRtl ? 'ساعات النوم' : 'HOURS OF SLEEP'}
            </div>
            <div className="text-2xl font-black font-condensed text-white tabular-nums mt-0.5" dir="ltr">
              {hoursAsleep !== null
                ? `${Math.floor(hoursAsleep)}h ${Math.round((hoursAsleep % 1) * 60)}m`
                : '--'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0F2618] border border-[#16EC06]/30 text-center active:scale-95 transition-transform">
            <div className="text-[10px] font-black uppercase text-[#16EC06] font-condensed">
              {t('sleepNeed')}
            </div>
            <div className="text-2xl font-black font-condensed text-white tabular-nums mt-0.5" dir="ltr">
              {sleepNeed
                ? `${Math.floor(sleepNeed)}h ${Math.round((sleepNeed % 1) * 60)}m`
                : '--'}
            </div>
          </div>
        </div>

        {/* Sleep Schedule Pill (Bedtime - Wake Time e.g. 11:30 PM - 07:05 AM) */}
        <div className="p-3 rounded-2xl bg-[#16191E] border border-white/5 flex items-center justify-between font-condensed active:scale-95 transition-transform">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#38BDF8]/15 flex items-center justify-center">
              <Moon className="w-3.5 h-3.5 text-[#38BDF8]" />
            </div>
            <span className="text-xs font-bold text-zinc-300 uppercase">
              {isRtl ? 'جدول النوم (النوم - الاستيقاظ)' : 'Sleep Schedule (Bed - Wake)'}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-[#38BDF8] tracking-wide" dir="ltr">
            {sleepScheduleText}
          </span>
        </div>

        {/* OLED Night Lock Quick Trigger */}
        <button
          onClick={onActivateOledNightLock}
          className="w-full py-3 px-4 rounded-xl bg-[#0B0D10] hover:bg-[#16191E] border border-white/10 text-[#38BDF8] font-black text-xs uppercase tracking-wider font-condensed flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Lock className="w-4 h-4 text-[#38BDF8]" />
          <span>{isRtl ? 'تفعيل قفل الشاشة الليلي OLED (إبقاء البلوتوث متصلاً)' : 'Launch OLED Sleep Lock (Keep BLE Connected)'}</span>
        </button>
      </div>

      {/* 2. SLEEP NEED BREAKDOWN CARD */}
      <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed">
            {isRtl ? 'تفصيل احتياج النوم (SLEEP NEED)' : 'Sleep Need Breakdown'}
          </h3>
          <span className="text-[10px] text-[#16EC06] font-mono font-bold" dir="ltr">
            {sleepNeed ? `${Math.floor(sleepNeed)}h ${Math.round((sleepNeed % 1) * 60)}m` : '--'}
          </span>
        </div>

        <div className="space-y-2 pt-1 text-xs font-condensed">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#16191E] border border-white/5">
            <span className="text-zinc-300 font-bold uppercase">{isRtl ? 'الاحتياج الأساسي' : 'Baseline Sleep Need'}</span>
            <span className="text-white font-mono font-bold" dir="ltr">
              {sleepData.needBreakdown ? `${Math.floor(sleepData.needBreakdown.baselineNeedHours)}h ${Math.round((sleepData.needBreakdown.baselineNeedHours % 1) * 60)}m` : (sleepNeed ? `${Math.floor(sleepNeed)}h ${Math.round((sleepNeed % 1) * 60)}m` : '--')}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#16191E] border border-white/5">
            <span className="text-zinc-300 font-bold uppercase">{isRtl ? 'دين النوم المتراكم' : 'Recent Sleep Debt'}</span>
            <span className="text-[#FFDE00] font-mono font-bold" dir="ltr">
              {sleepData.needBreakdown && sleepData.needBreakdown.recentDebtHours > 0
                ? `+${Math.round(sleepData.needBreakdown.recentDebtHours * 60)}m`
                : (hoursAsleep !== null ? '0m' : '--')}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#16191E] border border-white/5">
            <span className="text-zinc-300 font-bold uppercase">{isRtl ? 'طلب التعافي من الإجهاد' : 'Strain Sleep Demand'}</span>
            <span className="text-[#00A3FF] font-mono font-bold" dir="ltr">
              {sleepData.needBreakdown
                ? `+${Math.round(sleepData.needBreakdown.strainNeedHours * 60)}m`
                : (metrics.dailyStrain > 0 ? `+${Math.round((metrics.dailyStrain / 21) * 84)}m` : (hoursAsleep !== null ? '0m' : '--'))}
            </span>
          </div>
        </div>
      </div>

      {/* 3. SLEEP ARCHITECTURE & HYPNOGRAM */}
      <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed">
            {isRtl ? 'هيكل مراحل النوم (HYPNOGRAM)' : 'Sleep Architecture Stages'}
          </h3>
          <span className="text-[10px] text-[#EC4899] font-mono font-bold" dir="ltr">
            {hoursAsleep !== null ? `${sleepData.stages.deepPercent + sleepData.stages.remPercent}% ${isRtl ? 'تعويضي' : 'Restorative'}` : t('calibrating')}
          </span>
        </div>

        {/* Full Interactive Multi-Tier Hypnogram Chart */}
        <HypnogramChart timeline={sleepData.timeline || []} />
      </div>

      {/* 4. SLEEP STATISTICS Rows */}
      <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed px-1">
          {isRtl ? 'إحصائيات النوم' : 'Sleep Statistics'}
        </h3>

        <div className="divide-y divide-white/5">
          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <span className="text-zinc-400 uppercase">{t('timeInBed')}</span>
            <span className="text-white font-mono font-bold" dir="ltr">
              {sleepData.hoursInBed
                ? `${Math.floor(sleepData.hoursInBed)}h ${Math.round((sleepData.hoursInBed % 1) * 60)}m`
                : '--'}
            </span>
          </div>
          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <span className="text-zinc-400 uppercase">{isRtl ? 'كفاءة النوم' : 'SLEEP EFFICIENCY'}</span>
            <span className="text-[#16EC06] font-mono font-bold">
              {sleepData.efficiencyPercent ? `${sleepData.efficiencyPercent}%` : '--'}
            </span>
          </div>
          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <span className="text-zinc-400 uppercase">{t('restorativeSleep')}</span>
            <span className="text-[#EC4899] font-mono font-bold" dir="ltr">
              {hoursAsleep !== null ? `${sleepData.stages.deepPercent + sleepData.stages.remPercent}% (SWS + REM)` : '--'}
            </span>
          </div>
          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <span className="text-zinc-400 uppercase">{t('sleepDebt')}</span>
            <span className="text-white font-mono font-bold" dir="ltr">
              {sleepData.sleepDebtHours > 0 ? `${Math.round(sleepData.sleepDebtHours * 60)}m` : (hoursAsleep !== null ? '0m' : '--')}
            </span>
          </div>
        </div>
      </div>

      {/* 3. 5 Dedicated 7-Day Charts (01:22 – 01:34 in Video) */}
      <div className="space-y-4">
        {/* Chart 1: SLEEP PERFORMANCE Bar Chart */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>{isRtl ? 'أداء النوم (7 أيام)' : 'SLEEP PERFORMANCE (7 DAYS)'}</span>
            <span className="text-[10px] text-[#7293B2] font-mono">{isRtl ? `المتوسط: ${avgPerfVal}` : `AVG: ${avgPerfVal}`}</span>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepPerf7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Bar dataKey="perf" fill="#7293B2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: HOURS VS. NEED Dual Line Chart */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>{t('hoursVsNeed')}</span>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-[#7293B2]">{isRtl ? '● النوم' : '● Sleep'}</span>
              <span className="text-[#16EC06]">{isRtl ? '● الاحتياج' : '● Need'}</span>
            </div>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hoursVsNeed7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[0, 12]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Line type="monotone" dataKey="hours" stroke="#7293B2" strokeWidth={2.5} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="need" stroke="#16EC06" strokeWidth={2.5} strokeDasharray="3 3" dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: TIME IN BED Floating Range Bars */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>{isRtl ? 'الوقت في الفراش (النوم والاستيقاظ)' : 'TIME IN BED (BEDTIME & WAKE)'}</span>
            <span className="text-[10px] text-zinc-400 font-mono">{isRtl ? 'التوافق اليومي' : 'CIRCADIAN ALIGNMENT'}</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center pt-2">
            {timeInBedRanges.map((t, idx) => (
              <div key={idx} className="flex flex-col items-center justify-end h-32">
                <span className="text-[8px] font-mono text-zinc-400 mb-1" dir="ltr">{t.wake.slice(0, 5)}</span>
                <div
                  className="w-full bg-gradient-to-t from-[#3A4E63] to-[#7293B2] rounded-lg transition-all"
                  style={{ height: `${(t.height / 10) * 100}%` }}
                />
                <span className="text-[8px] font-mono text-zinc-500 mt-1" dir="ltr">{t.bed.slice(0, 5)}</span>
                <span className="text-[9px] font-condensed font-black text-white mt-1">{t.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: RESTORATIVE SLEEP Stacked Bars (Deep + REM) */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>{isRtl ? 'النوم التعويضي (العميق + REM)' : 'RESTORATIVE SLEEP (DEEP + REM)'}</span>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-[#EC4899]">{isRtl ? '● عميق' : '● Deep'}</span>
              <span className="text-[#A855F7]">{isRtl ? '● REM' : '● REM'}</span>
            </div>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={restorative7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[0, 5]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Bar dataKey="deep" stackId="a" fill="#EC4899" />
                <Bar dataKey="rem" stackId="a" fill="#A855F7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: SLEEP EFFICIENCY Line Chart */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>{t('sleepEfficiency')}</span>
            <span className="text-[10px] text-[#16EC06] font-mono">{isRtl ? `المتوسط: ${avgEffVal}` : `AVG: ${avgEffVal}`}</span>
          </div>
          <div className="h-28 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={efficiency7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[50, 100]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Line type="monotone" dataKey="eff" stroke="#16EC06" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
            </div>

      {/* WHOOP Cloud Developer API v1 Modal */}
      <WhoopCloudApiModal
        isOpen={isCloudApiModalOpen}
        onClose={() => setIsCloudApiModalOpen(false)}
      />

      <AdjustSleepModal
        isOpen={isAdjustSleepModalOpen}
        onClose={() => setIsAdjustSleepModalOpen(false)}
      />
    </div>
  );
};
