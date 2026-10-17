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
  Scale,
  Share2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TAP } from '../motion/springs';
import { HeartbeatBadge, EcgWave } from '../motion/LiveHeartbeat';
import { alarmEngine } from '../../services/alarmEngine';
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
}

import { useLanguage } from '../../i18n/LanguageContext';

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
}) => {
  const { t, isRtl, dayNames, formatNumber } = useLanguage();
  const [isOutlookModalOpen, setIsOutlookModalOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [pendingActivity, setPendingActivity] = useState<DetectedActivity | null>(() =>
    activityDetectionEngine.getPendingActivity()
  );
  const [editingSport, setEditingSport] = useState<string>('');

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
      {/* Interactive Auto-Detected Activity Banner */}
      {pendingActivity && (
        <div className="p-4 rounded-[24px] bg-[#12151A] border-2 border-[#00F0FF]/50 shadow-xl shadow-[#00F0FF]/10 space-y-3 animate-in slide-in-from-top-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#00F0FF]/20 text-[#00F0FF] flex items-center justify-center border border-[#00F0FF]/30">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#00F0FF] font-condensed">
                  {isRtl ? 'تم رصد نشاط رياضي تلقائياً' : 'AUTO-DETECTED ACTIVITY'}
                </span>
                <h4 className="text-sm font-black uppercase text-white font-condensed">
                  {editingSport || pendingActivity.sport}
                </h4>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0093E9]/20 border border-[#0093E9]/40 text-[#0093E9] text-xs font-black font-condensed">
              <Flame className="w-3.5 h-3.5" />
              <span>{pendingActivity.strain.toFixed(1)} {isRtl ? 'جهد' : 'Strain'}</span>
            </div>
          </div>

          {/* Metric details: Duration, Avg HR, Calories */}
          <div className="grid grid-cols-3 gap-2 text-center">
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
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-[11px] font-condensed font-bold">
            {['Running', 'Outdoor Walk', 'Functional Fitness', 'Cycling', 'Weightlifting'].map((sp) => (
              <button
                key={sp}
                onClick={() => {
                  hapticLight();
                  setEditingSport(sp);
                }}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  (editingSport || pendingActivity.sport) === sp
                    ? 'bg-white text-black border-white'
                    : 'bg-[#16191E] text-zinc-400 border-white/5 hover:text-white'
                }`}
              >
                {sp}
              </button>
            ))}
          </div>

          {/* Action buttons: Confirm & Save vs Discard */}
          <div className="flex items-center gap-2 pt-1 font-condensed">
            <button
              onClick={handleConfirmActivity}
              className="flex-1 py-2.5 rounded-xl bg-[#16EC06] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-98 transition-transform"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{isRtl ? 'تأكيد وحفظ النشاط' : 'Confirm & Save'}</span>
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

      {/* 1. Official WHOOP Concentric 3-Layer Ring Gauge around the "W" Logo (00:01) */}
      <div className="py-1">
        <WhoopConcentricTripleGauge
          metrics={metrics}
          onSelectTab={onSelectSubTab}
          activeSubTab="overview"
        />
      </div>

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
              <div key={s.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-1 rounded-full font-condensed font-black text-xs flex items-center gap-1.5 bg-[#0093E9]/20 text-[#0093E9] border border-[#0093E9]/40">
                    <Dumbbell className="w-3 h-3 stroke-[2.5]" />
                    <span>{s.strain.toFixed(1)}</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white uppercase font-sans">
                      {s.title}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      {Math.floor(s.durationSec / 60)} {isRtl ? 'دقيقة' : 'min'} • {s.avgHr} {t('bpm')}
                    </div>
                  </div>
                </div>

                <div className="text-end text-[10px] font-mono text-zinc-400">
                  <div>{new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div>{new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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
              onClick={onStartActivity}
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

        {/* TONIGHT'S SLEEP Card (Bound dynamically to Alarm Engine) */}
        {(() => {
          const alarmSettings = alarmEngine.getSettings();
          const isAlarmArmed = alarmSettings.enabled;
          const alarmDisplayTime = alarmSettings.exactTime || '07:30';

          let targetWakeMin = 7 * 60 + 30;
          if (alarmSettings.exactTime) {
            const [h, m] = alarmSettings.exactTime.split(':').map(Number);
            if (!isNaN(h) && !isNaN(m)) targetWakeMin = h * 60 + m;
          }

          const needMin = Math.round((settings.sleepNeedHours || 7.9) * 60) + 15;
          let bedMin = targetWakeMin - needMin;
          while (bedMin < 0) bedMin += 24 * 60;
          const bedH = Math.floor(bedMin / 60);
          const bedM = bedMin % 60;
          const recommendedBedtime = `${bedH.toString().padStart(2, '0')}:${bedM.toString().padStart(2, '0')}`;

          const statusLabel = isAlarmArmed
            ? alarmSettings.mode === 'sleep_goal'
              ? (isRtl ? 'منبه هدف النوم' : 'ALARM (SLEEP GOAL)')
              : alarmSettings.mode === 'recovery'
              ? (isRtl ? 'منبه التعافي الأخضر' : 'ALARM (RECOVERY)')
              : (isRtl ? 'المنبه مفعّل (وقت محدد)' : 'ALARM ON (EXACT)')
            : (isRtl ? 'المنبه غير مفعّل' : 'NO ALARM SET');

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
                  <span className={`w-2 h-2 rounded-full ${isAlarmArmed ? 'bg-[#16EC06]' : 'bg-zinc-600'}`} />
                  <span>{alarmDisplayTime}</span>
                </div>
                <div className={`text-[10px] font-black uppercase tracking-wider font-condensed ${isAlarmArmed ? 'text-[#16EC06]' : 'text-zinc-500'}`}>
                  {statusLabel}
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

        {/* Metric Row 5: STEPS & CADENCE */}
        {dashboardPrefs.steps && (
          <div className="p-4 rounded-[22px] bg-[#12151A] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center text-[#8A94A6]">
                <Footprints className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed">
                  {t('steps')}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  {t('target')}: 10,000 • {metrics.cadence > 0 ? `${metrics.cadence} spm` : (isRtl ? 'حساس IMU' : 'IMU SENSOR')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-end">
                <span className="text-2xl font-black font-condensed text-white tabular-nums">
                  {metrics.steps > 0 ? metrics.steps.toLocaleString() : '--'}
                </span>
              </div>
              <ChevronRight className={`w-4 h-4 text-zinc-600 ${isRtl ? 'rotate-180' : ''}`} />
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
                  {isRtl ? '14.0 د/د النطاق المعتاد' : '14.0 rpm Typical Range'}
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
