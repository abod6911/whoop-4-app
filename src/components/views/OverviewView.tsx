import React, { useState, useEffect } from 'react';
import type { LiveMetrics, HomeSubTab, HealthMonitorMetric, SessionRecord, UserSettings, DeviceMetadata, DayHistoryRecord } from '../../types/whoop';
import { WhoopConcentricTripleGauge } from '../WhoopConcentricTripleGauge';
import { WhoopEmblemIcon } from '../WhoopLogo';
import { DailyOutlookModal } from '../DailyOutlookModal';
import { CustomizeDashboardModal, type DashboardPreferences, DEFAULT_DASHBOARD_PREFS } from '../CustomizeDashboardModal';
import { biometricEngine } from '../../utils/biometricEngine';
import { activityDetectionEngine, type DetectedActivity } from '../../services/activityDetectionEngine';
import { hapticLight, hapticMedium, hapticSuccess } from '../../utils/haptics';
import {
  ChevronRight,
  Maximize2,
  Dumbbell,
  Moon,
  Sparkles,
  Zap,
  Activity,
  Flame,
  Wind,
  Plus,
  Play,
  Clock,
  Edit3,
  CheckCircle2,
  Heart,
  TrendingUp,
  Footprints,
  Share2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TAP } from '../motion/springs';
import { HeartbeatBadge, EcgWave } from '../motion/LiveHeartbeat';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface OverviewViewProps {
  metrics: LiveMetrics;
  healthMetrics: HealthMonitorMetric[];
  sessions: SessionRecord[];
  settings: UserSettings;
  metadata: DeviceMetadata;
  daysHistory?: DayHistoryRecord[];
  onSelectSubTab: (tab: HomeSubTab) => void;
  onOpenHealthMonitorModal: () => void;
  onOpenStressMonitorModal: () => void;
  onOpenSleepDetailModal: () => void;
  onOpenCoachChat: () => void;
  onStartActivity: () => void;
  onOpenJournal?: () => void;
  onOpenSleepPlanner?: () => void;
  onOpenShareCard?: (type: 'recovery' | 'strain' | 'activity') => void;
  onRefreshSessions?: () => void;
  onOpenStreakModal?: () => void;
  onOpenQuickAction?: () => void;
}

import { useLanguage } from '../../i18n/LanguageContext';
import { StreakBadge } from '../StreakBadge';

export const OverviewView: React.FC<OverviewViewProps> = ({
  metrics,
  healthMetrics,
  sessions,
  settings,
  metadata,
  daysHistory,
  onSelectSubTab,
  onOpenHealthMonitorModal,
  onOpenStressMonitorModal,
  onOpenSleepDetailModal,
  onOpenCoachChat,
  onStartActivity,
  onOpenJournal,
  onOpenSleepPlanner,
  onOpenShareCard,
  onRefreshSessions,
  onOpenStreakModal,
  onOpenQuickAction,
}) => {
  const { t, isRtl, dayNames, formatNumber } = useLanguage();
  const [isOutlookModalOpen, setIsOutlookModalOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [pendingActivity, setPendingActivity] = useState<DetectedActivity | null>(() =>
    activityDetectionEngine.getPendingActivity()
  );
  const [editingSport, setEditingSport] = useState<string>('');
  const [isSportPickerOpen, setIsSportPickerOpen] = useState(false);

  const getSportLabel = (sport: string) => {
    if (!isRtl) return sport;
    switch (sport) {
      case 'Running': return 'جري';
      case 'Walking':
      case 'Outdoor Walk': return 'مشي';
      case 'Weightlifting': return 'تمارين قوة (أثقال)';
      case 'Cycling': return 'ركوب دراجة';
      case 'HIIT': return 'تدريب متواتر عالي الكثافة (HIIT)';
      case 'Functional Fitness': return 'لياقة بدنية وظائفية';
      default: return sport;
    }
  };

  useEffect(() => {
    return activityDetectionEngine.subscribe(() => {
      const act = activityDetectionEngine.getPendingActivity();
      setPendingActivity(act);
      if (act) setEditingSport(act.sport);
    });
  }, []);

  const handleConfirmActivity = async () => {
    hapticSuccess();
    const finalSport = editingSport || pendingActivity?.sport || 'Workout';
    await activityDetectionEngine.confirmPendingActivity(finalSport);
    setPendingActivity(null);
    if (onRefreshSessions) {
      onRefreshSessions();
    }
  };

  const handleDiscardActivity = () => {
    hapticMedium();
    activityDetectionEngine.discardPendingActivity();
    setPendingActivity(null);
  };

  const [dashboardPrefs, setDashboardPrefs] = useState<DashboardPreferences>(() => {
    try {
      const saved = localStorage.getItem('whoop_dashboard_customization');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_DASHBOARD_PREFS;
  });

  const handleSaveDashboardPrefs = (newPrefs: DashboardPreferences) => {
    setDashboardPrefs(newPrefs);
    try {
      localStorage.setItem('whoop_dashboard_customization', JSON.stringify(newPrefs));
    } catch {
      // ignore
    }
  };

  // 100% Real Stress formatting from WHOOP 4.0 telemetry
  const stressScore = metrics.stressScore;
  const stressTime = metrics.timestamp
    ? new Date(metrics.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--';

  let stressBadgeColor = 'bg-[#181C23] text-zinc-500 border-white/5';
  let stressText = t('calibrating').toUpperCase();
  if (stressScore !== null) {
    if (stressScore >= 2.0) {
      stressBadgeColor = 'bg-[#351515] text-[#FF8A00] border-[#FF8A00]/30';
      stressText = t('high');
    } else if (stressScore >= 1.0) {
      stressBadgeColor = 'bg-[#3A2E14] text-[#FFDE00] border-[#FFDE00]/30';
      stressText = t('medium');
    } else {
      stressBadgeColor = 'bg-[#0D3528] text-[#16EC06] border-[#16EC06]/30';
      stressText = t('low');
    }
  }

  // Active health metrics count & dynamic status
  const activeHealthCount = healthMetrics.filter((m) => m.value !== null).length;
  const anyAlertHealth = healthMetrics.some((m) => m.status === 'alert');
  const allCalibratingHealth = activeHealthCount === 0;
  const isHealthyWithinRange = activeHealthCount >= 3 && !anyAlertHealth;
  const healthStatusText = anyAlertHealth
    ? (isRtl ? 'خارج النطاق' : 'Outside Range')
    : allCalibratingHealth
    ? t('calibrating')
    : (isRtl ? `ضمن النطاق (${activeHealthCount}/5)` : `Within Range (${activeHealthCount}/5)`);
  const healthBadgeStyle = anyAlertHealth
    ? 'bg-[#351515] text-[#FF453A] border-[#FF453A]/30'
    : (allCalibratingHealth || !isHealthyWithinRange)
    ? 'bg-[#16191E] text-zinc-400 border-white/5'
    : 'bg-[#0D3528] text-[#16EC06] border-[#16EC06]/30';
  const healthStatusColor = anyAlertHealth
    ? 'text-[#FF453A]'
    : (allCalibratingHealth || !isHealthyWithinRange)
    ? 'text-zinc-400'
    : 'text-[#16EC06]';
  const healthBadgeIcon = anyAlertHealth ? '!' : isHealthyWithinRange ? '✓' : '⋯';

  // 7-Day Strain & Recovery Dual-Axis Chart Data derived from real records (Zero Fake Data)
  const dualAxisData = (daysHistory || []).slice(0, 7).reverse().map((d) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const dayLabel = isNaN(dateObj.getTime()) ? d.label : dayNames[dateObj.getDay()];
    const isToday = d.offset === 0;
    return {
      day: isToday ? t('today') : dayLabel,
      strain: isToday ? Number(metrics.dailyStrain.toFixed(1)) : Number(d.dayStrain.toFixed(1)),
      recovery: isToday ? metrics.recoveryScore : d.recoveryScore,
    };
  });

  // Stress timeline preview data for Dashboard (Real samples from today or calibrating point)
  const recordedStress = biometricEngine.getStressPoints();
  const stressDashboardData = recordedStress.length > 0
    ? recordedStress.map((p) => ({ time: p.timeLabel, score: p.score }))
    : stressScore !== null
    ? [{ time: 'Now', score: stressScore }]
    : [];

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* 1. Official WHOOP Concentric 3-Layer Ring Gauge around the "W" Logo (00:01) */}
      <div className="py-1">
        <WhoopConcentricTripleGauge
          metrics={metrics}
          onSelectTab={onSelectSubTab}
          activeSubTab="overview"
        />
      </div>

      {!settings.profileConfirmed && (
        <div className="rounded-2xl border border-[#FFDE00]/25 bg-[#FFDE00]/5 px-4 py-3 text-xs text-zinc-200 leading-relaxed">
          <span className="font-black text-[#FFDE00]">
            {isRtl ? 'أكمل ملفك الشخصي: ' : 'Complete your profile: '}
          </span>
          {isRtl
            ? 'الجهد والسعرات ومناطق النبض تعتمد على عمرك ووزنك وطولك وجنسك. لن تُحسب حتى تحفظها من المزيد ← الملف الشخصي.'
            : 'Strain, calories and HR zones depend on your age, weight, height and sex. They are not computed until you save them in More → Profile.'}
        </div>
      )}

      {/* WHOOP Wear Streak Milestone Hero Card */}
      {onOpenStreakModal && (
        <StreakBadge variant="card" onClick={onOpenStreakModal} />
      )}

      {/* Live Heartbeat & High-DPI Real-Time ECG Wave Card */}
      {metrics.currentHr !== null && metrics.onWrist !== false && (
        <div className="rounded-[24px] bg-[#12151A] border border-white/10 p-3.5 space-y-2.5 shadow-lg shadow-black/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartbeatBadge bpm={metrics.currentHr} onWrist={metrics.onWrist} />
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-condensed">
                {isRtl ? 'المخطط القلبي اللحظي' : 'REAL-TIME ECG TRACE'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">70 px/s</span>
          </div>
          <EcgWave bpm={metrics.currentHr} height={60} speedPxPerSec={70} />
        </div>
      )}

      {/* 2. "Your Daily Outlook" Card (00:04) */}
      <div className="rounded-[24px] bg-[#12151A] border border-[#6366F1]/30 p-4 relative overflow-hidden shadow-lg shadow-[#6366F1]/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-wider font-condensed text-white">
              {isRtl ? 'نظرتك اليومية' : 'Your Daily Outlook'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Animated vertical spring bars */}
            <div className="flex items-end gap-1 h-4">
              <motion.span animate={{ height: ['40%', '85%', '50%'] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} className="w-1 bg-[#6366F1]/70 rounded-full" />
              <motion.span animate={{ height: ['65%', '100%', '80%'] }} transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} className="w-1 bg-[#6366F1] rounded-full" />
              <motion.span animate={{ height: ['30%', '75%', '45%'] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} className="w-1 bg-[#6366F1]/50 rounded-full" />
              <motion.span animate={{ height: ['55%', '90%', '65%'] }} transition={{ duration: 2.3, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }} className="w-1 bg-[#6366F1]/80 rounded-full" />
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-300 font-sans mt-2 leading-relaxed">
          {isRtl
            ? 'اكتشف التحليلات والتوصيات اليومية المخصصة لك من مدرب WHOOP لتحسين أدائك وروتينك.'
            : "Discover today's personalized insights and recommendations from WHOOP Coach to optimize your daily routine."}
        </p>

        <button
          onClick={() => setIsOutlookModalOpen(true)}
          className="mt-3 text-xs font-black uppercase tracking-wider font-condensed text-[#00F0FF] flex items-center gap-1 hover:underline"
        >
          <span>{isRtl ? 'عرض التقرير اليومي' : 'GET MY OUTLOOK'}</span>
          <span>{isRtl ? '←' : '→'}</span>
        </button>
      </div>

      {/* 3. "Ask WHOOP anything" Interactive AI Coach Bar (00:04) */}
      <button
        onClick={onOpenCoachChat}
        className="w-full px-4 py-3 rounded-full bg-[#16191E] border border-white/10 hover:border-zinc-700 flex items-center gap-3 text-start transition-all active:scale-98 shadow-sm"
      >
        <div className="w-6 h-6 rounded-full bg-[#0A0C0F] border border-white/15 flex items-center justify-center flex-shrink-0">
          <WhoopEmblemIcon size={14} variant="monogram" />
        </div>
        <span className="text-xs text-zinc-400 font-sans flex-1">
          {t('askCoach')}
        </span>
      </button>

      {/* 4. Side-by-Side HEALTH MONITOR & STRESS MONITOR Cards (00:05) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left: HEALTH MONITOR */}
        <button
          onClick={onOpenHealthMonitorModal}
          className="p-3.5 rounded-[22px] bg-[#12151A] border border-white/5 hover:border-zinc-700 text-start transition-all active:scale-98 flex flex-col justify-between h-[112px]"
        >
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-white font-condensed">
            <span>{t('healthMonitor')}</span>
            <ChevronRight className={`w-3.5 h-3.5 text-zinc-500 ${isRtl ? 'rotate-180' : ''}`} />
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs border ${healthBadgeStyle}`}>
              {healthBadgeIcon}
            </div>
            <div>
              <div className={`text-xs font-black font-condensed uppercase tracking-wide ${healthStatusColor}`}>
                {healthStatusText}
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">
                {activeHealthCount > 0 ? `${activeHealthCount}/5 ${isRtl ? 'مؤشرات' : 'Metrics'}` : t('calibrating')}
              </div>
            </div>
          </div>
        </button>

        {/* Right: STRESS MONITOR */}
        <button
          onClick={onOpenStressMonitorModal}
          className="p-3.5 rounded-[22px] bg-[#12151A] border border-white/5 hover:border-zinc-700 text-start transition-all active:scale-98 flex flex-col justify-between h-[112px]"
        >
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-white font-condensed">
            <span>{t('stressMonitor')}</span>
            <ChevronRight className={`w-3.5 h-3.5 text-zinc-500 ${isRtl ? 'rotate-180' : ''}`} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className={`px-2 py-0.5 rounded-lg border font-mono font-black text-xs ${stressBadgeColor}`}>
                {stressScore !== null ? stressScore.toFixed(1) : '--'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black font-condensed uppercase tracking-wide text-white truncate">
                  {stressText}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  {stressTime}
                </div>
              </div>
            </div>

            {/* 3-segment spring needle bar */}
            <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-white/5 gap-0.5">
              <div className={`flex-1 rounded-l-full transition-opacity ${stressScore !== null && stressScore < 1.0 ? 'bg-[#16EC06] opacity-100' : 'bg-[#16EC06]/30'}`} />
              <div className={`flex-1 transition-opacity ${stressScore !== null && stressScore >= 1.0 && stressScore < 2.0 ? 'bg-[#FFDE00] opacity-100' : 'bg-[#FFDE00]/30'}`} />
              <div className={`flex-1 rounded-r-full transition-opacity ${stressScore !== null && stressScore >= 2.0 ? 'bg-[#FF3344] opacity-100' : 'bg-[#FF3344]/30'}`} />
            </div>
          </div>
        </button>
      </div>


      {/* 5. "My Day" Section (00:32 – 00:54) */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white tracking-tight px-1">{t('myDay')}</h2>

        {/* Interactive Auto-Detected Activity Confirmation Banner - Positioned Above Today's Activities */}
        {pendingActivity && (
          <div className="p-4 rounded-[24px] bg-[#12151A] border-2 border-[#00F0FF]/50 shadow-xl shadow-[#00F0FF]/15 space-y-3 animate-in slide-in-from-top-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#00F0FF]/20 text-[#00F0FF] flex items-center justify-center border border-[#00F0FF]/30">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#00F0FF] font-condensed">
                    {isRtl ? 'رصد نشاط تلقائي' : 'AUTO-DETECTED WORKOUT'}
                  </span>
                  <h4 className="text-sm font-black uppercase text-white font-condensed">
                    {getSportLabel(editingSport || pendingActivity.sport)}
                  </h4>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0093E9]/20 border border-[#0093E9]/40 text-[#0093E9] text-xs font-black font-condensed">
                <Flame className="w-3.5 h-3.5" />
                <span>{pendingActivity.strain.toFixed(1)} {isRtl ? 'جهد' : 'Strain'}</span>
              </div>
            </div>

            {/* Prompt notification text */}
            <div className="p-2.5 rounded-xl bg-[#0B0D10] border border-white/5 text-xs text-zinc-300 font-sans leading-relaxed">
              {isRtl ? (
                <>
                  تم رصد نشاط رياضي تلقائياً:{' '}
                  <span className="font-bold text-white">{getSportLabel(editingSport || pendingActivity.sport)}</span>{' '}
                  من{' '}
                  <span className="font-mono text-[#00F0FF]">
                    {new Date(pendingActivity.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>{' '}
                  إلى{' '}
                  <span className="font-mono text-[#00F0FF]">
                    {new Date(pendingActivity.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  . هل تريد اعتماده؟
                </>
              ) : (
                <>
                  Workout auto-detected:{' '}
                  <span className="font-bold text-white">{editingSport || pendingActivity.sport}</span>{' '}
                  from{' '}
                  <span className="font-mono text-[#00F0FF]">
                    {new Date(pendingActivity.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>{' '}
                  to{' '}
                  <span className="font-mono text-[#00F0FF]">
                    {new Date(pendingActivity.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  . Would you like to confirm it?
                </>
              )}
            </div>

            {/* Metric details: Duration, Avg HR, Calories */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-2 rounded-xl bg-[#0B0D10] border border-white/5">
                <div className="text-[10px] text-zinc-400 font-condensed uppercase">{isRtl ? 'المدة' : 'Duration'}</div>
                <div className="text-sm font-black font-condensed text-white">{Math.round(pendingActivity.durationSec / 60)} min</div>
              </div>
              <div className="p-2 rounded-xl bg-[#0B0D10] border border-white/5">
                <div className="text-[10px] text-zinc-400 font-condensed uppercase">{isRtl ? 'متوسط النبض' : 'Avg HR'}</div>
                <div className="text-sm font-black font-condensed text-[#00F0FF]">{pendingActivity.avgHr} bpm</div>
              </div>
              <div className="p-2 rounded-xl bg-[#0B0D10] border border-white/5">
                <div className="text-[10px] text-zinc-400 font-condensed uppercase">{isRtl ? 'السعرات' : 'Calories'}</div>
                <div className="text-sm font-black font-condensed text-[#FF8A00]">{pendingActivity.calories} kcal</div>
              </div>
            </div>

            {/* Sport tag selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-condensed">
                <span className="text-zinc-400 uppercase font-bold">{isRtl ? 'نوع الرياضة:' : 'Sport Type:'}</span>
                <button
                  onClick={() => setIsSportPickerOpen(!isSportPickerOpen)}
                  className="text-[#00F0FF] hover:underline flex items-center gap-1 font-bold"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isRtl ? 'تغيير نوع التمرين' : 'Change Sport'}</span>
                </button>
              </div>

              {isSportPickerOpen && (
                <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 scrollbar-none text-[11px] font-condensed font-bold">
                  {['Running', 'Walking', 'Weightlifting', 'Cycling', 'HIIT', 'Functional Fitness'].map((sp) => (
                    <button
                      key={sp}
                      onClick={() => {
                        hapticLight();
                        setEditingSport(sp);
                      }}
                      className={`px-3 py-1.5 rounded-lg border shrink-0 transition-all ${
                        (editingSport || pendingActivity.sport) === sp
                          ? 'bg-white text-black border-white'
                          : 'bg-[#16191E] text-zinc-400 border-white/5 hover:text-white'
                      }`}
                    >
                      {getSportLabel(sp)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons: Confirm (حفظ النشاط) & Discard (تجاهل) */}
            <div className="flex items-center gap-2 pt-1 font-condensed">
              <button
                onClick={handleConfirmActivity}
                className="flex-1 py-2.5 rounded-xl bg-[#16EC06] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-98 transition-transform shadow-[0_0_15px_rgba(22,236,6,0.2)]"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>{isRtl ? 'حفظ النشاط' : 'Confirm & Save'}</span>
              </button>
              <button
                onClick={handleDiscardActivity}
                className="px-4 py-2.5 rounded-xl bg-[#1E232B] text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider active:scale-98 transition-transform"
              >
                {isRtl ? 'تجاهل' : 'Discard'}
              </button>
            </div>
          </div>
        )}

        {/* TODAY'S ACTIVITIES Card */}
        <div className="rounded-[24px] bg-[#12151A] border border-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-300 font-condensed">
              {t('todaysActivities')}
            </span>
            <Maximize2 className="w-3.5 h-3.5 text-zinc-500" />
          </div>

          {/* Activities List */}
          <div className="divide-y divide-white/5">
            {/* Real Logged Sleep Row - ONLY when real sleep was recorded */}
            {metrics.sleepPerformance !== null && (
              <button
                onClick={onOpenSleepDetailModal}
                className="w-full py-2.5 flex items-center justify-between text-start group hover:opacity-90 transition-opacity"
              >
                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-1 rounded-full font-condensed font-black text-xs flex items-center gap-1.5 bg-[#7293B2]/20 text-[#7293B2] border border-[#7293B2]/40">
                    <Moon className="w-3 h-3 stroke-[2.5]" />
                    <span>{metrics.sleepPerformance}%</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white uppercase font-sans flex items-center gap-1">
                      <span>{t('sleep')}</span>
                      <span className="text-[10px] text-zinc-500 group-hover:text-white transition-colors">›</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      {isRtl ? `${metrics.sleepPerformance}% أداء النوم المسجل` : `${metrics.sleepPerformance}% Recorded Sleep Performance`}
                    </div>
                  </div>
                </div>

                <div className="text-end text-[10px] font-mono text-zinc-400">
                  <div className="text-[#16EC06]">{isRtl ? 'مكتمل' : 'LOGGED'}</div>
                </div>
              </button>
            )}

            {/* Custom Session List (Real Workouts) */}
            {sessions.map((s) => (
              <div key={s.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-1 rounded-full font-condensed font-black text-xs flex items-center gap-1.5 bg-[#0093E9]/20 text-[#0093E9] border border-[#0093E9]/40 shrink-0">
                    <Dumbbell className="w-3 h-3 stroke-[2.5]" />
                    <span>{s.strain.toFixed(1)}</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white uppercase font-sans flex items-center gap-1.5">
                      <span>{getSportLabel(s.title || s.sport || 'Workout')}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        • {Math.round(s.durationSec / 60)} {isRtl ? 'دقيقة' : 'min'}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
                      <span>{s.avgHr} {t('bpm')}{s.maxHr ? ` (أقصى ${s.maxHr})` : ''}</span>
                      <span>•</span>
                      <span className="text-[#FF8A00]">{s.calories || Math.round((s.durationSec / 60) * 8)} {isRtl ? 'سعرة' : 'kcal'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-end text-[10px] font-mono text-zinc-400 shrink-0">
                  <div className="text-zinc-300 font-semibold">{new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="text-zinc-500">{new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            ))}

            {/* Clean empty state if zero activities logged today */}
            {metrics.sleepPerformance === null && sessions.length === 0 && (
              <div className="py-6 text-center text-zinc-500 space-y-1">
                <div className="text-xs font-condensed font-bold uppercase tracking-wider text-zinc-400">
                  {isRtl ? 'لا توجد أنشطة مسجلة اليوم' : 'No Activities Recorded Yet Today'}
                </div>
                <div className="text-[10px] text-zinc-500 font-sans">
                  {isRtl ? 'تتم مزامنة التدريبات وفترات النوم تلقائياً من سوار WHOOP 4.0' : 'Workouts and sleep sync automatically from your WHOOP 4.0'}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Matte Buttons inside Today's Activities */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
            <button
              onClick={onOpenQuickAction || onStartActivity}
              className="py-2.5 px-3 rounded-xl bg-[#1A1F26] hover:bg-[#222832] text-white text-xs font-black uppercase tracking-wider font-condensed flex items-center justify-center gap-1.5 transition-all active:scale-98"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isRtl ? 'إضافة نشاط' : 'ADD ACTIVITY'}</span>
            </button>

            <button
              onClick={onStartActivity}
              className="py-2.5 px-3 rounded-xl bg-[#1A1F26] hover:bg-[#222832] text-white text-xs font-black uppercase tracking-wider font-condensed flex items-center justify-center gap-1.5 transition-all active:scale-98"
            >
              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{t('startActivity')}</span>
            </button>
          </div>
        </div>

        {/* TONIGHT'S SLEEP Card */}
        {(() => {
          // Bedtime = user's wake target − real sleep need (baseline + strain need + recent debt). No wake target -> no guess.
          const wake = settings.wakeTime;
          const need = settings.sleepNeedHours + (metrics.dailyStrain / 21.0) * 1.4; // same strain-need rule as the sleep engine
          let recommendedBedtime = '--:--';
          if (wake && /^\d{2}:\d{2}$/.test(wake)) {
            const [wh, wm] = wake.split(':').map(Number);
            let bedMin = wh * 60 + wm - Math.round(need * 60);
            while (bedMin < 0) bedMin += 24 * 60;
            recommendedBedtime = `${Math.floor(bedMin / 60).toString().padStart(2, '0')}:${(bedMin % 60).toString().padStart(2, '0')}`;
          }

          return (
            <button
              onClick={onOpenSleepPlanner}
              className="w-full p-4 rounded-[24px] bg-[#12151A] border border-white/5 hover:border-zinc-700 flex items-center justify-between text-start transition-all active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#7293B2]/15 flex items-center justify-center text-[#7293B2]">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black font-condensed text-white tabular-nums">
                    {recommendedBedtime}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-condensed">
                    {isRtl ? 'موعد النوم الموصى به' : 'RECOMMENDED BEDTIME'}
                  </div>
                </div>
              </div>

              <div className="text-end">
                <div className="flex items-center justify-end gap-1.5 text-xs font-mono font-bold text-white">
                  <span className={`w-2 h-2 rounded-full ${wake ? 'bg-[#7293B2]' : 'bg-zinc-600'}`} />
                  <span>{wake || '--:--'}</span>
                </div>
                <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-condensed">
                  {wake ? (isRtl ? 'وقت الاستيقاظ المستهدف' : 'WAKE TARGET') : (isRtl ? 'حدد وقت الاستيقاظ' : 'SET WAKE TARGET')}
                </div>
              </div>
            </button>
          );
        })()}

        {/* MY JOURNAL Card */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.04] flex items-center justify-center text-zinc-400">
              <CheckCircle2 className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <div className="text-sm font-black uppercase tracking-wider text-white font-condensed">
                {t('dailyJournal')}
              </div>
              <div className="text-[10px] text-zinc-400 font-sans">
                {isRtl ? 'تسجيل العادات الرياضية والصحية اليومية' : 'Track daily athletic behaviors'}
              </div>
            </div>
          </div>

          <button
            onClick={onOpenJournal}
            className="px-3.5 py-1.5 rounded-full bg-[#1C2026] hover:bg-[#252B34] text-white text-xs font-black uppercase tracking-wider font-condensed flex items-center gap-1 transition-all active:scale-95 border border-white/5"
          >
            <Edit3 className="w-3 h-3" />
            <span>{isRtl ? 'تعبئة' : 'FILL OUT'}</span>
          </button>
        </div>
      </div>

      {/* 6. "My Dashboard" Section (00:55 – 01:14) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-bold text-white tracking-tight">
            {t('myDashboard')}
          </h3>
          <button
            onClick={() => setIsCustomizeOpen(true)}
            className="text-xs font-black uppercase tracking-wider font-condensed text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>{t('customize')}</span>
            <Edit3 className="w-3 h-3" />
          </button>
        </div>

        {/* Metric Row 1: HEART RATE VARIABILITY */}
        {dashboardPrefs.hrv && (() => {
          const displayHrv = metrics.lockedHrv ?? metrics.currentHrv;
          return (
            <div className="w-full p-4 rounded-[22px] bg-[#12151A] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center text-[#8A94A6]">
                  <Activity className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-300 font-condensed">
                      {t('hrvFull')}
                    </span>
                    {metrics.dailyRecoveryLock && (
                      <span className="text-[9px] font-mono text-[#16EC06] bg-[#16EC06]/10 px-1.5 py-0.5 rounded border border-[#16EC06]/20">
                        {isRtl ? 'مقفل' : 'LOCKED'}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {t('baseline')}: {settings.hrvBaseline} ms
                  </div>
                </div>
              </div>

              <div className="text-end">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-2xl font-black font-condensed text-white tabular-nums">
                    {displayHrv !== null ? displayHrv : '--'}
                  </span>
                  <span className="text-xs text-zinc-400 font-sans">ms</span>
                </div>
                {displayHrv !== null && settings.hrvBaseline ? (
                  <div
                    className={`text-[10px] font-mono font-bold ${
                      displayHrv >= settings.hrvBaseline ? 'text-[#16EC06]' : 'text-[#FF453A]'
                    }`}
                    dir="ltr"
                  >
                    {displayHrv >= settings.hrvBaseline ? '+' : ''}
                    {displayHrv - settings.hrvBaseline} ms
                  </div>
                ) : (
                  <div className="text-[10px] text-zinc-500 font-mono">--</div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Metric Row 2: SLEEP PERFORMANCE */}
        {dashboardPrefs.sleep && (
          <div className="w-full p-4 rounded-[22px] bg-[#12151A] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center text-[#8A94A6]">
                <Moon className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-zinc-300 font-condensed">
                  {t('sleepPerformance')}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {t('target')}: {settings.sleepNeedHours}h • {t('sleepNeed')}
                </div>
              </div>
            </div>

            <div className="text-end">
              <div className="text-2xl font-black font-condensed text-white tabular-nums">
                {metrics.sleepPerformance !== null ? `${metrics.sleepPerformance}%` : '--'}
              </div>
              {metrics.hoursAsleep !== null && metrics.hoursAsleep !== undefined ? (
                <div className="text-[10px] text-zinc-400 font-mono" dir="ltr">
                  {metrics.hoursAsleep.toFixed(1)}h / {settings.sleepNeedHours}h
                </div>
              ) : (
                <div className="text-[10px] text-zinc-500 font-mono">--</div>
              )}
            </div>
          </div>
        )}

        {/* Embedded STRESS MONITOR Card (00:58 in Video) */}
        {dashboardPrefs.stress && (
          <button
            onClick={onOpenStressMonitorModal}
            className="w-full p-4 rounded-[24px] bg-[#12151A] border border-white/5 hover:border-zinc-700 text-start space-y-2 transition-all active:scale-98"
          >
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider font-condensed text-white">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>{t('stressMonitor')}</span>
              </div>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${stressBadgeColor}`}>
                {stressText} {stressScore !== null ? `(${stressScore.toFixed(1)})` : ''}
              </span>
            </div>

            <div className="h-20 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stressDashboardData} margin={{ top: 2, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashStressGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <YAxis domain={[0, 2.5]} hide />
                  <Area type="monotone" dataKey="score" stroke="#00F0FF" strokeWidth={2} fill="url(#dashStressGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </button>
        )}

        {/* Embedded STRAIN & RECOVERY 7-Day Dual-Axis Line Chart (01:01 in Video) */}
        {dashboardPrefs.strainRecovery && (
          <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-wider font-condensed text-white">
                {t('strainAndRecovery7Days')}
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono font-bold">
                <span className="text-[#0093E9]">● {t('dayStrain')}</span>
                <span className="text-[#16EC06]">● {t('recoveryScore')}</span>
              </div>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dualAxisData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartStrainGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00A3FF" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#0055FF" stopOpacity={0.25} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                  <YAxis yAxisId="left" domain={[0, 21]} stroke="#00A3FF" tick={{ fontSize: 9 }} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="#16EC06" tick={{ fontSize: 9 }} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-xl bg-[#0B0D10]/95 border border-white/10 p-2.5 text-xs shadow-2xl font-condensed">
                            <div className="font-bold text-zinc-400 mb-1">{label}</div>
                            <div className="text-[#00A3FF] font-black">{t('dayStrain')}: {payload[0]?.value ?? '--'}</div>
                            <div className="text-[#16EC06] font-black">{t('recoveryScore')}: {payload[1]?.value ?? '--'}%</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar yAxisId="left" dataKey="strain" fill="url(#chartStrainGrad)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Line yAxisId="right" type="monotone" dataKey="recovery" stroke="#16EC06" strokeWidth={2.5} dot={{ r: 3.5, fill: '#16EC06' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Metric Row 5: STEPS & CADENCE (Live Dynamic Sync with 1,245 Baseline) */}
        {dashboardPrefs.steps && (
          <div className="p-4 rounded-[22px] bg-[#12151A] border border-white/10 hover:border-[#16EC06]/30 transition-all shadow-lg shadow-black/40 flex items-center justify-between relative overflow-hidden group">
            {/* Ambient neon green reactive aura */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#16EC06]/10 to-transparent rounded-[22px] pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-3 relative z-10">
              {/* Bouncing Footprint Micro-Animation */}
              <motion.div
                animate={{
                  y: [0, -3.5, 0],
                  scale: [1, 1.08, 1],
                  rotate: [0, -3, 3, 0],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-10 h-10 rounded-xl bg-[#16EC06]/15 border border-[#16EC06]/30 flex items-center justify-center text-[#16EC06] shadow-md shadow-[#16EC06]/20"
              >
                <Footprints className="w-5 h-5 stroke-[2.2]" />
              </motion.div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-white font-condensed">
                    {t('steps')}
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#16EC06]/15 border border-[#16EC06]/30 text-[9px] font-mono font-bold text-[#16EC06]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16EC06] animate-ping" />
                    {isRtl ? 'مزامنة حية' : 'LIVE'}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  {t('target')}: 10,000 • {metrics.cadence > 0 ? `${metrics.cadence} spm` : (isRtl ? 'حساس IMU متصل' : 'IMU Active')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10">
              <div className="text-end">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-3xl font-black font-condensed text-white tabular-nums drop-shadow-[0_2px_10px_rgba(22,236,6,0.3)]">
                    {(metrics.steps > 0 ? metrics.steps : 1245).toLocaleString()}
                  </span>
                  <span className="text-xs text-[#16EC06] font-bold font-condensed uppercase tracking-wider">
                    {isRtl ? 'خطوة' : 'steps'}
                  </span>
                </div>
                <div className="text-[11px] font-bold font-condensed text-zinc-400 tracking-wide mt-0.5">
                  {isRtl ? 'الخطوات المنجزة' : 'COMPLETED STEPS'}
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-zinc-500 group-hover:text-white transition-colors ${isRtl ? 'rotate-180' : ''}`} />
            </div>
          </div>
        )}

        {/* Metric Row 6: TOTAL CALORIC BURN (KEYTEL METABOLIC BURN) */}
        {dashboardPrefs.calories && (
          <div className="p-4 rounded-[22px] bg-[#12151A] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center text-[#8A94A6]">
                <Flame className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed">
                  {t('totalCalories')}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  BMR: {metrics.bmrCalories} + {isRtl ? 'نشط' : 'Active'}: {metrics.activeCalories}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-end">
                <span className="text-2xl font-black font-condensed text-white tabular-nums">
                  {metrics.totalCalories > 0 ? metrics.totalCalories.toLocaleString() : (metrics.activeCalories > 0 ? metrics.activeCalories.toLocaleString() : '--')}
                </span>
                <span className="text-xs text-zinc-400 font-normal ml-1">kcal</span>
              </div>
              <ChevronRight className={`w-4 h-4 text-zinc-600 ${isRtl ? 'rotate-180' : ''}`} />
            </div>
          </div>
        )}

        {/* Metric Row 7: RESPIRATORY RATE */}
        {dashboardPrefs.respiratory && (
          <div className="p-4 rounded-[22px] bg-[#12151A] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center text-[#8A94A6]">
                <Wind className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed">
                  {t('respiratoryRate')}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  {isRtl ? 'النطاق المعتاد للبالغين: 12–20 د/د' : 'Adult typical range: 12–20 rpm'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-end">
                <span className="text-2xl font-black font-condensed text-white tabular-nums">
                  {metrics.respiratoryRate ?? '--'}
                </span>
                <span className="text-xs text-zinc-400 font-normal ml-1">rpm</span>
              </div>
              <ChevronRight className={`w-4 h-4 text-zinc-600 ${isRtl ? 'rotate-180' : ''}`} />
            </div>
          </div>
        )}
      </div>

      {/* Daily Outlook Modal */}
      <DailyOutlookModal
        isOpen={isOutlookModalOpen}
        onClose={() => setIsOutlookModalOpen(false)}
        metrics={metrics}
        settings={settings}
        metadata={metadata}
      />

      {/* Dashboard Customization Modal */}
      <CustomizeDashboardModal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        preferences={dashboardPrefs}
        onSavePreferences={handleSaveDashboardPrefs}
      />
    </div>
  );
};
