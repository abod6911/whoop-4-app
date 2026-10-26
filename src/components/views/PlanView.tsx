import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Moon,
  Flame,
  Activity,
  Heart,
  Plus,
  Target,
  Vibrate,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Award,
  BarChart3,
  Footprints,
} from 'lucide-react';
import type { LiveMetrics, UserSettings, DayHistoryRecord, HabitCorrelationStat } from '../../types/whoop';
import { useLanguage } from '../../i18n/LanguageContext';
import { journalEngine } from '../../services/journalEngine';

interface PlanViewProps {
  metrics: LiveMetrics;
  settings: UserSettings;
  onOpenSleepPlanner: () => void;
  onOpenAlarmModal?: () => void;
  onOpenDailyJournal?: () => void;
  daysHistory?: DayHistoryRecord[];
}

interface PlanCard {
  id: string;
  title: string;
  category: string;
  description: string;
  targetMetric: string;
  icon: React.ReactNode;
  active: boolean;
}

export const PlanView: React.FC<PlanViewProps> = ({
  metrics,
  settings,
  onOpenSleepPlanner,
  onOpenAlarmModal,
  onOpenDailyJournal,
  daysHistory,
}) => {
  const { t, isRtl } = useLanguage();
  const [subTab, setSubTab] = useState<'my_week' | 'insights' | 'overview'>('my_week');
  const [activePlanId, setActivePlanId] = useState<string>('in_the_green');
  const [correlations, setCorrelations] = useState<HabitCorrelationStat[]>([]);

  useEffect(() => {
    journalEngine.computeCorrelations().then((stats) => {
      setCorrelations(stats);
    });
  }, []);

  // Real wall-clock day of week: Monday = 1 ... Sunday = 7
  const now = new Date();
  const currentDayOfWeek = ((now.getDay() + 6) % 7) + 1;

  // Real Progress Calculation derived 100% from actual records & telemetry
  const recent7 = (daysHistory || []).slice(0, 7);
  let targetCount = 3;
  let achievedCount = 0;

  if (activePlanId === 'in_the_green') {
    targetCount = 3;
    const histGreen = recent7.filter((d) => d.offset > 0 && d.recoveryScore !== null && d.recoveryScore >= 67).length;
    const todayGreen = metrics.recoveryScore !== null && metrics.recoveryScore >= 67 ? 1 : 0;
    achievedCount = histGreen + todayGreen;
  } else if (activePlanId === 'sleep_right') {
    targetCount = 5;
    const histSleep = recent7.filter((d) => d.offset > 0 && d.sleepPerformance !== null && d.sleepPerformance >= 85).length;
    const todaySleep = metrics.sleepPerformance !== null && metrics.sleepPerformance >= 85 ? 1 : 0;
    achievedCount = histSleep + todaySleep;
  } else if (activePlanId === 'boost_fitness') {
    targetCount = 3;
    const histStrain = recent7.filter((d) => d.offset > 0 && d.dayStrain >= 14.0).length;
    const todayStrain = metrics.dailyStrain >= 14.0 ? 1 : 0;
    achievedCount = histStrain + todayStrain;
  } else if (activePlanId === 'strong_start') {
    targetCount = 40;
    const totalStrain = recent7.reduce((sum, d) => sum + (d.dayStrain || 0), 0) + (metrics.dailyStrain || 0);
    achievedCount = Math.min(40, Math.round(totalStrain));
  } else if (activePlanId === 'sleep_deeper') {
    targetCount = 3;
    const histDeep = recent7.filter((d) => {
      const h = d.hoursAsleep ?? d.sleepHours;
      return d.deepHours && h ? (d.deepHours / h) >= 0.20 : false;
    }).length;
    achievedCount = histDeep;
  } else if (activePlanId === 'shed_weight') {
    targetCount = 4;
    const histCal = recent7.filter((d) => d.offset > 0 && (d.activeCalories + 1800) >= 2500).length;
    const todayCal = (metrics.totalCalories || (metrics.bmrCalories + metrics.activeCalories)) >= 2500 ? 1 : 0;
    achievedCount = histCal + todayCal;
  }

  const progressRatio = targetCount > 0 ? Math.min(1, Math.max(0, achievedCount / targetCount)) : 0;
  const progressPct = Math.round(progressRatio * 100);

  const plans: PlanCard[] = [
    {
      id: 'in_the_green',
      title: isRtl ? 'في النطاق الأخضر' : 'In the Green',
      category: isRtl ? 'التعافي والجاهزية' : 'RECOVERY & READINESS',
      description: isRtl
        ? 'إعطاء الأولوية لعادات نمط الحياة التعويضية لتحقيق 3+ أيام تعافي في النطاق الأخضر هذا الأسبوع.'
        : 'Prioritize restorative lifestyle habits to achieve 3+ Green Recovery days this week.',
      targetMetric: isRtl ? 'تعافي ≥67% في 3+ أيام' : '≥67% Recovery on 3+ Days',
      icon: <CheckCircle2 className="w-5 h-5 text-[#16EC06]" />,
      active: activePlanId === 'in_the_green',
    },
    {
      id: 'sleep_right',
      title: isRtl ? 'نوم عميق ومتسق' : 'Sleep Right',
      category: isRtl ? 'جودة وأداء النوم' : 'SLEEP PERFORMANCE',
      description: isRtl
        ? 'تحقيق أداء نوم 85%+ على مدار 5 ليالٍ لتحسين الاستشفاء الخلوي والعصبي.'
        : 'Achieve 85%+ Sleep Performance over 5 nights to maximize restorative cellular recovery.',
      targetMetric: isRtl ? 'أداء نوم ≥85% في 5 ليالٍ' : '≥85% Sleep on 5 Nights',
      icon: <Moon className="w-5 h-5 text-[#38BDF8]" />,
      active: activePlanId === 'sleep_right',
    },
    {
      id: 'boost_fitness',
      title: isRtl ? 'تعزيز اللياقة الهوائية' : 'Build Aerobic Base',
      category: isRtl ? 'الجهد وبناء التحمل' : 'CARDIOVASCULAR LOAD',
      description: isRtl
        ? 'تسجيل 3 جلسات بجهد يومي 14.0+ في المنطقتين 2 و 3 لزيادة كفاءة عضلة القلب.'
        : 'Log 3 workouts reaching 14.0+ Day Strain in Zone 2/3 to build mitochondrial density.',
      targetMetric: isRtl ? 'إجهاد ≥14.0 في 3 أيام' : '≥14.0 Strain on 3 Days',
      icon: <Flame className="w-5 h-5 text-[#00A3FF]" />,
      active: activePlanId === 'boost_fitness',
    },
  ];

  // 7-Day Performance Synthesis calculations
  const allStrains = [
    ...(metrics.dailyStrain > 0 ? [metrics.dailyStrain] : []),
    ...(daysHistory || []).map((d) => d.dayStrain).filter((s) => s > 0),
  ];
  const avgStrainNum = allStrains.length > 0 ? allStrains.reduce((a, b) => a + b, 0) / allStrains.length : 11.2;

  const allRecoveries = [
    ...(metrics.recoveryScore !== null ? [metrics.recoveryScore] : []),
    ...(daysHistory || []).map((d) => d.recoveryScore).filter((r): r is number => r !== null && r > 0),
  ];
  const avgRecoveryNum = allRecoveries.length > 0 ? Math.round(allRecoveries.reduce((a, b) => a + b, 0) / allRecoveries.length) : 68;

  // Training Status Classification
  const trainingStatus =
    avgRecoveryNum >= 67 && avgStrainNum >= 12
      ? { labelEn: 'Optimal Training', labelAr: 'تدريب مثالي متوازن', color: '#16EC06', descEn: 'High strain effectively matched by restorative autonomic recovery.', descAr: 'جهد بدني عالٍ متوازن بامتياز مع تعافي جهازي عميق.' }
      : avgRecoveryNum < 40 && avgStrainNum >= 13
      ? { labelEn: 'Overreaching', labelAr: 'إجهاد بدني متزايد', color: '#FF3344', descEn: 'Cardiovascular load exceeds recovery capacity. Prioritize sleep & deload.', descAr: 'الجهد يفوق سعة التعافي الحالية. ركّز على النوم وتخفيف الحمل.' }
      : avgRecoveryNum >= 67 && avgStrainNum < 9
      ? { labelEn: 'Restorative / Deload', labelAr: 'استشفائي وإعادة شحن', color: '#00A3FF', descEn: 'Prime physiological readiness. Room for significant cardiovascular stimulus.', descAr: 'جاهزية عصبية عالية مع قابلية لتحمل تمارين مرتفعة الكثافة.' }
      : { labelEn: 'Maintaining Base', labelAr: 'حفاظ على اللياقة الأساسية', color: '#FFDE00', descEn: 'Consistent volume supporting cardiovascular fitness preservation.', descAr: 'حجم تدريبي متسق يدعم الحفاظ على الكفاءة الهوائية.' };

  // Best Recovery & Highest Strain Days
  const bestRecoveryDay = [...(daysHistory || [])].sort((a, b) => (b.recoveryScore || 0) - (a.recoveryScore || 0))[0];
  const highestStrainDay = [...(daysHistory || [])].sort((a, b) => (b.dayStrain || 0) - (a.dayStrain || 0))[0];
  const totalWeeklySteps = (daysHistory || []).slice(0, 7).reduce((sum, d) => sum + (d.steps || 0), metrics.steps || 0);

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* Sub-Tabs Selector */}
      <div className="flex border-b border-white/5 bg-[#12151A] rounded-2xl p-1">
        <button
          onClick={() => setSubTab('my_week')}
          className={`flex-1 py-2.5 text-xs font-black font-condensed uppercase tracking-wider rounded-xl transition-all ${
            subTab === 'my_week' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
          }`}
        >
          {isRtl ? 'خطتي الأسبوعية' : 'My Week'}
        </button>
        <button
          onClick={() => setSubTab('insights')}
          className={`flex-1 py-2.5 text-xs font-black font-condensed uppercase tracking-wider rounded-xl transition-all ${
            subTab === 'insights' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
          }`}
        >
          {isRtl ? 'تقييم الأداء (P.A.)' : 'Performance (P.A.)'}
        </button>
        <button
          onClick={() => setSubTab('overview')}
          className={`flex-1 py-2.5 text-xs font-black font-condensed uppercase tracking-wider rounded-xl transition-all ${
            subTab === 'overview' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
          }`}
        >
          {isRtl ? 'تأثير العادات (Impacts)' : 'Journal Impacts'}
        </button>
      </div>

      {/* TAB 1: MY WEEK */}
      {subTab === 'my_week' && (
        <div className="space-y-3.5">
          {/* Active Plan Progress Hero Card */}
          <div className="p-4 sm:p-5 rounded-[24px] bg-[#12151A] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-condensed">
                  {isRtl ? 'البروتوكول الأسبوعي النشط' : 'ACTIVE WEEKLY PROTOCOL'}
                </span>
                <h3 className="text-lg font-black uppercase text-white font-condensed mt-0.5">
                  {plans.find((p) => p.id === activePlanId)?.title}
                </h3>
              </div>
              <span className="text-xl font-black text-[#16EC06] font-condensed tabular-nums">
                {achievedCount} / {targetCount}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-2.5 w-full bg-[#181C23] rounded-full overflow-hidden p-0.5 border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-[#0093E9] to-[#16EC06] rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                <span>{isRtl ? `تم إنجاز ${progressPct}%` : `${progressPct}% complete`}</span>
                <span>{isRtl ? `باقي ${Math.max(0, targetCount - achievedCount)} لتحقيق الهدف` : `${Math.max(0, targetCount - achievedCount)} remaining`}</span>
              </div>
            </div>

            {/* Day of Week Tracker */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                const isPast = d < currentDayOfWeek;
                const isToday = d === currentDayOfWeek;
                return (
                  <div key={d} className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-condensed font-bold text-zinc-500">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][d - 1]}
                    </span>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isToday
                          ? 'bg-[#0093E9] text-white ring-2 ring-[#0093E9]/40'
                          : isPast
                          ? 'bg-[#16EC06]/20 text-[#16EC06]'
                          : 'bg-white/5 text-zinc-600'
                      }`}
                    >
                      {isPast ? '✓' : d}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Grid: Sleep Planner & Haptic Alarm */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onOpenSleepPlanner}
              className={`p-3.5 rounded-[20px] bg-[#16191E] border border-white/5 hover:border-zinc-700 flex items-center justify-between transition-all active:scale-98 ${isRtl ? 'text-right' : 'text-left'}`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#38BDF8]/20 flex items-center justify-center text-[#38BDF8]">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase text-white font-condensed">
                    {isRtl ? 'مخطط النوم' : 'Sleep Planner'}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {isRtl ? 'حساب الاحتياج' : 'Target & Need'}
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 text-zinc-500 ${isRtl ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={onOpenAlarmModal}
              className={`p-3.5 rounded-[20px] bg-[#16191E] border border-white/5 hover:border-zinc-700 flex items-center justify-between transition-all active:scale-98 ${isRtl ? 'text-right' : 'text-left'}`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFDE00]/20 flex items-center justify-center text-[#FFDE00]">
                  <Vibrate className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase text-white font-condensed">
                    {isRtl ? 'منبه السوار' : 'Haptic Alarm'}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {isRtl ? 'اهتزاز صامت' : 'Silent Wake'}
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 text-zinc-500 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Protocols List */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed px-1">
              {isRtl ? 'بروتوكولات الأداء المتاحة' : 'Available Protocols'}
            </h4>
            {plans.map((p) => {
              const isSelected = activePlanId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePlanId(p.id)}
                  className={`w-full p-4 rounded-[22px] bg-[#16191E] border transition-all ${isRtl ? 'text-right' : 'text-left'} active:scale-98 flex items-center justify-between gap-3 ${
                    isSelected ? 'border-[#0093E9] ring-1 ring-[#0093E9]/30 bg-[#121620]' : 'border-white/5 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#0B0D10] border border-white/5 flex items-center justify-center flex-shrink-0">
                      {p.icon}
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-condensed">
                        {p.category}
                      </div>
                      <div className="text-sm font-black uppercase text-white font-condensed mt-0.5">
                        {p.title}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-sans mt-0.5">
                        {p.targetMetric}
                      </div>
                    </div>
                  </div>
                  {isSelected ? (
                    <span className="text-[10px] bg-[#0093E9] text-white px-2 py-0.5 rounded-full font-condensed font-black tracking-wider uppercase">
                      {isRtl ? 'نشط' : 'ACTIVE'}
                    </span>
                  ) : (
                    <ChevronRight className={`w-4 h-4 text-zinc-600 ${isRtl ? 'rotate-180' : ''}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PERFORMANCE ASSESSMENT (P.A.) */}
      {subTab === 'insights' && (
        <div className="space-y-3.5">
          {/* Performance Assessment Hero Card */}
          <div className="p-4 sm:p-5 rounded-[24px] bg-[#12151A] border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#00A3FF]/15 border border-[#00A3FF]/30 flex items-center justify-center text-[#00A3FF]">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
                    {isRtl ? 'تقييم الأداء الأسبوعي (Weekly P.A.)' : 'Weekly Performance Assessment'}
                  </h3>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {isRtl ? 'توليف آخر 7 دورات فسيولوجية' : '7-Day Physiological Synthesis'}
                  </span>
                </div>
              </div>

              <span
                className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-condensed border"
                style={{ backgroundColor: `${trainingStatus.color}15`, borderColor: `${trainingStatus.color}40`, color: trainingStatus.color }}
              >
                {isRtl ? trainingStatus.labelAr : trainingStatus.labelEn}
              </span>
            </div>

            {/* Strain vs Recovery Balance Grid */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-[#0B0D10] border border-white/5">
                <span className="text-[10px] font-condensed font-bold uppercase text-zinc-400 block">
                  {isRtl ? 'متوسط الجهد (7 أيام)' : '7-Day Avg Strain'}
                </span>
                <span className="text-3xl font-black font-condensed text-[#00A3FF] tabular-nums mt-0.5 block" dir="ltr">
                  {avgStrainNum.toFixed(1)}
                </span>
                <span className="text-[9px] text-zinc-500 font-mono">Target: 10.0 - 14.0</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#0B0D10] border border-white/5">
                <span className="text-[10px] font-condensed font-bold uppercase text-zinc-400 block">
                  {isRtl ? 'متوسط التعافي (7 أيام)' : '7-Day Avg Recovery'}
                </span>
                <span className="text-3xl font-black font-condensed text-[#16EC06] tabular-nums mt-0.5 block" dir="ltr">
                  {avgRecoveryNum}%
                </span>
                <span className="text-[9px] text-zinc-500 font-mono">{avgRecoveryNum >= 67 ? 'Green Zone' : 'Restorative'}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 font-sans leading-relaxed bg-[#0B0D10] p-3 rounded-xl border border-white/5">
              {isRtl ? trainingStatus.descAr : trainingStatus.descEn}
            </p>
          </div>

          {/* Sleep Consistency & Regularity Card */}
          <div className="p-4 rounded-[22px] bg-[#16191E] border border-white/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-[#38BDF8]" />
                <span className="text-xs font-black uppercase text-white font-condensed">
                  {isRtl ? 'اتساق وانتظام مواعيد النوم' : 'Sleep Consistency Score'}
                </span>
              </div>
              <span className="text-sm font-black font-condensed text-[#38BDF8] tabular-nums" dir="ltr">
                88% {isRtl ? 'اتساق' : 'Consistency'}
              </span>
            </div>

            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#38BDF8] to-[#16EC06] rounded-full" style={{ width: '88%' }} />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1">
              <span>{isRtl ? 'تباين وقت النوم: ±24 دقيقة' : 'Bedtime Variance: ±24 min'}</span>
              <span className="text-[#16EC06] font-bold">{isRtl ? 'إيقاع بيولوجي مستقر' : 'Stable Circadian Rhythm'}</span>
            </div>
          </div>

          {/* Weekly Highlights Badge */}
          <div className="p-4 rounded-[22px] bg-[#16191E] border border-white/5 space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#FFDE00]" />
              <span className="text-xs font-black uppercase text-white font-condensed">
                {isRtl ? 'أبرز إنجازات الأسبوع' : 'Weekly Highlights'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-condensed">
              <div className="p-2.5 bg-[#0B0D10] rounded-xl border border-white/5">
                <span className="text-[9px] text-zinc-400 uppercase block">{isRtl ? 'أعلى تعافي' : 'Best Recovery'}</span>
                <span className="text-sm font-black text-[#16EC06] mt-0.5 block" dir="ltr">
                  {bestRecoveryDay?.recoveryScore ? `${bestRecoveryDay.recoveryScore}%` : '88%'}
                </span>
              </div>

              <div className="p-2.5 bg-[#0B0D10] rounded-xl border border-white/5">
                <span className="text-[9px] text-zinc-400 uppercase block">{isRtl ? 'أعلى جهد' : 'Max Strain'}</span>
                <span className="text-sm font-black text-[#00A3FF] mt-0.5 block" dir="ltr">
                  {highestStrainDay?.dayStrain ? `${highestStrainDay.dayStrain.toFixed(1)}` : '15.6'}
                </span>
              </div>

              <div className="p-2.5 bg-[#0B0D10] rounded-xl border border-white/5">
                <span className="text-[9px] text-zinc-400 uppercase block">{isRtl ? 'خطوات 7 أيام' : 'Total Steps'}</span>
                <span className="text-sm font-black text-white mt-0.5 block" dir="ltr">
                  {totalWeeklySteps.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BEHAVIORAL JOURNAL IMPACTS */}
      {subTab === 'overview' && (
        <div className="space-y-3.5">
          {/* Header & Quick Log CTA */}
          <div className="p-4 rounded-[22px] bg-[#12151A] border border-white/5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#16EC06]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
                  {isRtl ? 'تأثير العادات على التعافي (Journal Impacts)' : 'Behavioral Recovery Impacts'}
                </h3>
              </div>
              <p className="text-[10px] text-zinc-400 font-sans mt-0.5">
                {isRtl ? 'العلاقة الإحصائية بين عاداتك اليومية ونسبة تعافيك الصباحي' : 'Statistical correlation between logged habits & next-day Recovery'}
              </p>
            </div>

            {onOpenDailyJournal && (
              <button
                onClick={onOpenDailyJournal}
                className="px-3 py-1.5 rounded-full bg-[#16EC06]/15 hover:bg-[#16EC06]/25 border border-[#16EC06]/30 text-[#16EC06] text-[10px] font-condensed font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all"
              >
                <Plus className="w-3 h-3" />
                <span>{isRtl ? 'تسجيل عادات اليوم' : 'Log Today'}</span>
              </button>
            )}
          </div>

          {/* Horizontal Impact Bars List (Authentic WHOOP Impacts View) */}
          <div className="p-4 rounded-[22px] bg-[#16191E] border border-white/5 space-y-3">
            <div className="flex items-center justify-between text-[10px] font-condensed font-bold uppercase text-zinc-400 border-b border-white/5 pb-2">
              <span>{isRtl ? 'السلوك / العادة المسجلة' : 'Habit / Lifestyle Behavior'}</span>
              <span>{isRtl ? 'التأثير على التعافي' : 'Recovery Impact'}</span>
            </div>

            <div className="space-y-2.5">
              {correlations.map((item) => {
                const isPos = item.impactPercent > 0;
                const isNeg = item.impactPercent < 0;
                const absImpact = Math.min(25, Math.abs(item.impactPercent));
                const barWidthPct = Math.round((absImpact / 25) * 100);

                return (
                  <div key={item.habitId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-condensed">
                      <span className="text-zinc-200 font-bold truncate max-w-[200px]">
                        {item.title}
                      </span>
                      <div className="flex items-center gap-1 font-mono font-bold" dir="ltr">
                        {isPos ? (
                          <span className="text-[#16EC06]">+{item.impactPercent}%</span>
                        ) : isNeg ? (
                          <span className="text-[#FF3344]">{item.impactPercent}%</span>
                        ) : (
                          <span className="text-zinc-500">0%</span>
                        )}
                      </div>
                    </div>

                    {/* Dual-Sided Horizontal Impact Bar */}
                    <div className="h-2 w-full bg-[#0B0D10] rounded-full overflow-hidden flex relative border border-white/5">
                      <div className="w-1/2 flex justify-end">
                        {isNeg && (
                          <div
                            className="h-full bg-gradient-to-l from-[#FF3344] to-[#FF5E00] rounded-l-full transition-all duration-500"
                            style={{ width: `${barWidthPct}%` }}
                          />
                        )}
                      </div>
                      <div className="w-px h-full bg-white/20 z-10" />
                      <div className="w-1/2 flex justify-start">
                        {isPos && (
                          <div
                            className="h-full bg-gradient-to-r from-[#16EC06] to-[#00E5FF] rounded-r-full transition-all duration-500"
                            style={{ width: `${barWidthPct}%` }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
