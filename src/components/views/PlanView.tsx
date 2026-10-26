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
  Check,
  Zap,
  Clock,
} from 'lucide-react';
import type { LiveMetrics, UserSettings, DayHistoryRecord, HabitCorrelationStat } from '../../types/whoop';
import { useLanguage } from '../../i18n/LanguageContext';
import { journalEngine } from '../../services/journalEngine';
import { alarmEngine } from '../../services/alarmEngine';
import { hapticLight, hapticMedium } from '../../utils/haptics';

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

  // Live Alarm Settings Subscription
  const [alarmSettings, setAlarmSettings] = useState(() => alarmEngine.getSettings());
  useEffect(() => {
    return alarmEngine.subscribe(() => {
      setAlarmSettings(alarmEngine.getSettings());
    });
  }, []);

  // Live Journal Correlations
  useEffect(() => {
    journalEngine.computeCorrelations().then((stats) => {
      setCorrelations(stats);
    });
  }, []);

  // Real wall-clock day of week: Monday = 1 ... Sunday = 7
  const now = new Date();
  const currentDayOfWeek = ((now.getDay() + 6) % 7) + 1;

  // Real Progress Calculation derived strictly from actual records & telemetry
  const recent7 = (daysHistory || []).slice(0, 7);

  // 1. In the Green Progress (Recovery >= 67%)
  const histGreen = recent7.filter((d) => d.offset > 0 && d.recoveryScore !== null && d.recoveryScore >= 67).length;
  const todayGreen = metrics.recoveryScore !== null && metrics.recoveryScore >= 67 ? 1 : 0;
  const greenProgress = histGreen + todayGreen;

  // 2. Sleep Right Progress (Sleep Performance >= 85%)
  const histSleep = recent7.filter((d) => d.offset > 0 && d.sleepPerformance !== null && d.sleepPerformance >= 85).length;
  const todaySleep = metrics.sleepPerformance !== null && metrics.sleepPerformance >= 85 ? 1 : 0;
  const sleepProgress = histSleep + todaySleep;

  // 3. Build Aerobic Base Progress (Day Strain >= 14.0)
  const histStrain = recent7.filter((d) => d.offset > 0 && d.dayStrain >= 14.0).length;
  const todayStrain = metrics.dailyStrain >= 14.0 ? 1 : 0;
  const strainProgress = histStrain + todayStrain;

  // Active Plan Stats
  let targetCount = 3;
  let achievedCount = greenProgress;
  if (activePlanId === 'sleep_right') {
    targetCount = 5;
    achievedCount = sleepProgress;
  } else if (activePlanId === 'boost_fitness') {
    targetCount = 3;
    achievedCount = strainProgress;
  }

  const progressRatio = targetCount > 0 ? Math.min(1, Math.max(0, achievedCount / targetCount)) : 0;
  const progressPct = Math.round(progressRatio * 100);

  // Unified Semantic Domain Themes for Active & Selection States
  const getProtocolTheme = (id: string) => {
    switch (id) {
      case 'in_the_green':
        return {
          id: 'in_the_green',
          accent: '#16EC06',
          accentGlow: 'rgba(22, 236, 6, 0.45)',
          heroGradient: 'from-[#16EC06]/[0.09] via-[#12151A] to-[#12151A]',
          borderActive: 'border-[#16EC06]/40 ring-1 ring-[#16EC06]/20 bg-gradient-to-r from-[#16EC06]/[0.07] to-transparent',
          pillActive: 'bg-[#16EC06]/15 text-[#16EC06] border border-[#16EC06]/35 shadow-[0_0_12px_rgba(22,236,6,0.25)]',
          iconContainer: 'bg-[#16EC06]/15 border border-[#16EC06]/30 text-[#16EC06]',
          progressFill: 'bg-gradient-to-r from-[#16EC06]/80 to-[#16EC06]',
          bubbleCompleted: 'bg-[#16EC06]/20 text-[#16EC06] border border-[#16EC06]/40 shadow-[0_0_8px_rgba(22,236,6,0.3)]',
          bubbleToday: 'border-2 border-[#16EC06] text-white shadow-[0_0_10px_rgba(22,236,6,0.4)]',
          progressCount: greenProgress,
          targetCount: 3,
          progressTextEn: `${greenProgress}/3 Days Completed`,
          progressTextAr: `${greenProgress} من 3 أيام مكتملة`,
        };
      case 'sleep_right':
        return {
          id: 'sleep_right',
          accent: '#00F0FF',
          accentGlow: 'rgba(0, 240, 255, 0.45)',
          heroGradient: 'from-[#7B61FF]/[0.11] via-[#12151A] to-[#12151A]',
          borderActive: 'border-[#00F0FF]/40 ring-1 ring-[#00F0FF]/20 bg-gradient-to-r from-[#7B61FF]/[0.09] to-transparent',
          pillActive: 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/35 shadow-[0_0_12px_rgba(0,240,255,0.25)]',
          iconContainer: 'bg-[#7B61FF]/15 border border-[#7B61FF]/30 text-[#00F0FF]',
          progressFill: 'bg-gradient-to-r from-[#7B61FF] to-[#00F0FF]',
          bubbleCompleted: 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_8px_rgba(0,240,255,0.3)]',
          bubbleToday: 'border-2 border-[#00F0FF] text-white shadow-[0_0_10px_rgba(0,240,255,0.4)]',
          progressCount: sleepProgress,
          targetCount: 5,
          progressTextEn: `${sleepProgress}/5 Nights Completed`,
          progressTextAr: `${sleepProgress} من 5 ليالٍ مكتملة`,
        };
      case 'boost_fitness':
      default:
        return {
          id: 'boost_fitness',
          accent: '#0093E9',
          accentGlow: 'rgba(0, 147, 233, 0.45)',
          heroGradient: 'from-[#0093E9]/[0.09] via-[#12151A] to-[#12151A]',
          borderActive: 'border-[#0093E9]/40 ring-1 ring-[#0093E9]/20 bg-gradient-to-r from-[#0093E9]/[0.07] to-transparent',
          pillActive: 'bg-[#0093E9]/15 text-[#0093E9] border border-[#0093E9]/35 shadow-[0_0_12px_rgba(0,147,233,0.25)]',
          iconContainer: 'bg-[#0093E9]/15 border border-[#0093E9]/30 text-[#0093E9]',
          progressFill: 'bg-gradient-to-r from-[#0093E9]/80 to-[#00A3FF]',
          bubbleCompleted: 'bg-[#0093E9]/20 text-[#0093E9] border border-[#0093E9]/40 shadow-[0_0_8px_rgba(0,147,233,0.3)]',
          bubbleToday: 'border-2 border-[#0093E9] text-white shadow-[0_0_10px_rgba(0,147,233,0.4)]',
          progressCount: strainProgress,
          targetCount: 3,
          progressTextEn: `${strainProgress}/3 Workouts Completed`,
          progressTextAr: `${strainProgress} من 3 جلسات مكتملة`,
        };
    }
  };

  const activeTheme = getProtocolTheme(activePlanId);

  // Chronological Status of each Day in Current Week (1 = Mon ... 7 = Sun)
  const getDayStatus = (d: number) => {
    const isPast = d < currentDayOfWeek;
    const isToday = d === currentDayOfWeek;
    const isUpcoming = d > currentDayOfWeek;
    const dayOffset = currentDayOfWeek - d;

    let isCompleted = false;
    if (isToday) {
      if (activePlanId === 'in_the_green') {
        isCompleted = metrics.recoveryScore !== null && metrics.recoveryScore >= 67;
      } else if (activePlanId === 'sleep_right') {
        isCompleted = metrics.sleepPerformance !== null && metrics.sleepPerformance >= 85;
      } else if (activePlanId === 'boost_fitness') {
        isCompleted = metrics.dailyStrain >= 14.0;
      }
    } else if (isPast) {
      const rec = recent7.find((item) => item.offset === dayOffset);
      if (rec) {
        if (activePlanId === 'in_the_green') {
          isCompleted = rec.recoveryScore !== null && rec.recoveryScore >= 67;
        } else if (activePlanId === 'sleep_right') {
          isCompleted = rec.sleepPerformance !== null && rec.sleepPerformance >= 85;
        } else if (activePlanId === 'boost_fitness') {
          isCompleted = rec.dayStrain >= 14.0;
        }
      }
    }

    return { isPast, isToday, isUpcoming, isCompleted };
  };

  // Live Telemetry for Sleep Planner Card
  const baselineHours = settings?.sleepNeedHours ?? 7.9;
  const strainDebtHours = Math.round((metrics.dailyStrain / 21.0) * 1.4 * 10) / 10;
  const totalNeedHours = baselineHours + strainDebtHours;
  const sleepNeedFormatted = `${Math.floor(totalNeedHours)}h ${Math.round((totalNeedHours % 1) * 60)}m`;

  const alarmWakeTime = alarmSettings.exactTime || settings?.wakeTime || '07:00';
  const [wH, wM] = alarmWakeTime.split(':').map(Number);
  const targetTotalMin = Math.round(totalNeedHours * 60);
  let bedTotalMin = ((isNaN(wH) ? 7 : wH) * 60 + (isNaN(wM) ? 0 : wM)) - targetTotalMin;
  if (bedTotalMin < 0) bedTotalMin += 24 * 60;
  const bedH = Math.floor(bedTotalMin / 60);
  const bedM = bedTotalMin % 60;
  const bedtimeStr = `${bedH.toString().padStart(2, '0')}:${bedM.toString().padStart(2, '0')}`;

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
    },
    {
      id: 'sleep_right',
      title: isRtl ? 'نوم عميق ومتسق' : 'Sleep Right',
      category: isRtl ? 'جودة وأداء النوم' : 'SLEEP PERFORMANCE',
      description: isRtl
        ? 'تحقيق أداء نوم 85%+ على مدار 5 ليالٍ لتحسين الاستشفاء الخلوي والعصبي.'
        : 'Achieve 85%+ Sleep Performance over 5 nights to maximize restorative cellular recovery.',
      targetMetric: isRtl ? 'أداء نوم ≥85% في 5 ليالٍ' : '≥85% Sleep on 5 Nights',
      icon: <Moon className="w-5 h-5 text-[#00F0FF]" />,
    },
    {
      id: 'boost_fitness',
      title: isRtl ? 'تعزيز اللياقة الهوائية' : 'Build Aerobic Base',
      category: isRtl ? 'الجهد وبناء التحمل' : 'CARDIOVASCULAR LOAD',
      description: isRtl
        ? 'تسجيل 3 جلسات بجهد يومي 14.0+ في المنطقتين 2 و 3 لزيادة كفاءة عضلة القلب.'
        : 'Log 3 workouts reaching 14.0+ Day Strain in Zone 2/3 to build mitochondrial density.',
      targetMetric: isRtl ? 'إجهاد ≥14.0 في 3 أيام' : '≥14.0 Strain on 3 Days',
      icon: <Flame className="w-5 h-5 text-[#0093E9]" />,
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

  const bestRecoveryDay = [...(daysHistory || [])].sort((a, b) => (b.recoveryScore || 0) - (a.recoveryScore || 0))[0];
  const highestStrainDay = [...(daysHistory || [])].sort((a, b) => (b.dayStrain || 0) - (a.dayStrain || 0))[0];
  const totalWeeklySteps = (daysHistory || []).slice(0, 7).reduce((sum, d) => sum + (d.steps || 0), metrics.steps || 0);

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* 1. Authentic WHOOP Dark Glassmorphic Segmented Tab Switcher */}
      <div className="bg-[#12151A] p-1 rounded-2xl border border-white/[0.06] grid grid-cols-3 gap-1 select-none shadow-md">
        <button
          onClick={() => {
            hapticLight();
            setSubTab('my_week');
          }}
          className={`relative py-2.5 px-1 rounded-xl text-[11px] font-condensed font-bold tracking-wider uppercase transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
            subTab === 'my_week'
              ? 'bg-[#1E232B] text-white border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.4)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
          }`}
        >
          <span>{isRtl ? 'خطتي الأسبوعية' : 'My Week'}</span>
          {subTab === 'my_week' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#16EC06] shadow-[0_0_6px_rgba(22,236,6,0.8)]" />
          )}
        </button>

        <button
          onClick={() => {
            hapticLight();
            setSubTab('insights');
          }}
          className={`relative py-2.5 px-1 rounded-xl text-[11px] font-condensed font-bold tracking-wider uppercase transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
            subTab === 'insights'
              ? 'bg-[#1E232B] text-white border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.4)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
          }`}
        >
          <span>{isRtl ? 'تقييم الأداء' : 'Performance (P.A.)'}</span>
          {subTab === 'insights' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#0093E9] shadow-[0_0_6px_rgba(0,147,233,0.8)]" />
          )}
        </button>

        <button
          onClick={() => {
            hapticLight();
            setSubTab('overview');
          }}
          className={`relative py-2.5 px-1 rounded-xl text-[11px] font-condensed font-bold tracking-wider uppercase transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
            subTab === 'overview'
              ? 'bg-[#1E232B] text-white border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.4)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
          }`}
        >
          <span>{isRtl ? 'تأثير العادات' : 'Journal Impacts'}</span>
          {subTab === 'overview' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#7B61FF] shadow-[0_0_6px_rgba(123,97,255,0.8)]" />
          )}
        </button>
      </div>

      {/* TAB 1: MY WEEK */}
      {subTab === 'my_week' && (
        <div className="space-y-3.5">
          {/* 2. Active Weekly Protocol Hero Card with Strict Color Cohesion */}
          <div className={`p-4 sm:p-5 rounded-[24px] bg-gradient-to-b ${activeTheme.heroGradient} border ${activeTheme.borderActive} space-y-4 shadow-xl transition-all duration-500`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-condensed block">
                  {isRtl ? 'البروتوكول الأسبوعي النشط' : 'ACTIVE WEEKLY PROTOCOL'}
                </span>
                <h3 className="text-lg font-black uppercase text-white font-condensed mt-0.5 tracking-wide">
                  {plans.find((p) => p.id === activePlanId)?.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-2xl font-black font-condensed tabular-nums drop-shadow-md"
                  style={{ color: activeTheme.accent }}
                >
                  {achievedCount} / {targetCount}
                </span>
              </div>
            </div>

            {/* Glowing Linear Progress Bar with Smooth Width Transition */}
            <div className="space-y-1.5">
              <div className="h-2.5 w-full bg-[#181C23] rounded-full overflow-hidden p-0.5 border border-white/5 relative">
                <div
                  className={`h-full ${activeTheme.progressFill} rounded-full transition-all duration-700 ease-out`}
                  style={{
                    width: `${progressPct}%`,
                    boxShadow: `0 0 10px ${activeTheme.accentGlow}`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                <span style={{ color: activeTheme.accent }} className="font-bold">
                  {isRtl ? `تم إنجاز ${progressPct}%` : `${progressPct}% achieved`}
                </span>
                <span>
                  {isRtl
                    ? `باقي ${Math.max(0, targetCount - achievedCount)} لتحقيق الهدف`
                    : `${Math.max(0, targetCount - achievedCount)} remaining to goal`}
                </span>
              </div>
            </div>

            {/* 7-Day Weekly Tracker Row with Interactive Daily Status Rings */}
            <div className="pt-2 border-t border-white/5">
              <div className="flex items-center justify-between gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                  const { isPast, isToday, isUpcoming, isCompleted } = getDayStatus(d);
                  const dayLetter = ['M', 'T', 'W', 'T', 'F', 'S', 'S'][d - 1];

                  return (
                    <div key={d} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                      <span className="text-[10px] font-condensed font-black uppercase text-zinc-400">
                        {dayLetter}
                      </span>

                      {/* Daily Status Bubble */}
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all relative ${
                          isCompleted
                            ? activeTheme.bubbleCompleted
                            : isToday
                            ? `bg-white/[0.08] ${activeTheme.bubbleToday}`
                            : 'bg-white/[0.03] border border-white/10 text-zinc-500'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          <span className="text-[10px] font-condensed font-black tabular-nums">
                            {d}
                          </span>
                        )}

                        {/* Subtle Today Pulse Indicator */}
                        {isToday && (
                          <span
                            className="absolute -inset-1 rounded-full animate-ping opacity-25"
                            style={{ backgroundColor: activeTheme.accent }}
                          />
                        )}
                      </div>

                      {/* Micro "TODAY" Badge */}
                      <span
                        className={`text-[8px] font-black uppercase tracking-tighter truncate ${
                          isToday ? 'opacity-100 font-bold' : 'opacity-0'
                        }`}
                        style={{ color: isToday ? activeTheme.accent : 'transparent' }}
                      >
                        {isRtl ? 'اليوم' : 'TODAY'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Live Informative Cards: Sleep Planner & Haptic Alarm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Live Sleep Planner Card */}
            <button
              onClick={() => {
                hapticLight();
                onOpenSleepPlanner();
              }}
              className={`p-3.5 sm:p-4 rounded-[22px] bg-[#16191E] border border-white/5 hover:border-[#7B61FF]/40 bg-gradient-to-br from-[#7B61FF]/[0.03] to-transparent flex items-center justify-between transition-all duration-200 active:scale-[0.98] group ${
                isRtl ? 'text-right' : 'text-left'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#7B61FF]/15 border border-[#7B61FF]/30 flex items-center justify-center text-[#00F0FF] flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Moon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black uppercase text-white font-condensed tracking-wide flex items-center gap-1.5">
                    <span>{isRtl ? 'مخطط النوم' : 'Sleep Planner'}</span>
                  </div>
                  <div className="text-[10px] font-mono mt-0.5 truncate flex items-center gap-1.5" dir="ltr">
                    <span className="text-[#00F0FF] font-bold">
                      {isRtl ? `النوم ${bedtimeStr}` : `Bedtime ${bedtimeStr}`}
                    </span>
                    <span className="text-zinc-600 select-none">•</span>
                    <span className="text-zinc-300">
                      {isRtl ? `احتياج ${sleepNeedFormatted}` : `${sleepNeedFormatted} Need`}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-zinc-500 group-hover:text-white transition-colors flex-shrink-0 ${isRtl ? 'rotate-180' : ''}`} />
            </button>

            {/* Live Haptic Alarm Card */}
            <button
              onClick={() => {
                hapticLight();
                onOpenAlarmModal?.();
              }}
              className={`p-3.5 sm:p-4 rounded-[22px] bg-[#16191E] border border-white/5 hover:border-[#FFDE00]/40 bg-gradient-to-br from-[#FFDE00]/[0.03] to-transparent flex items-center justify-between transition-all duration-200 active:scale-[0.98] group ${
                isRtl ? 'text-right' : 'text-left'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#FFDE00]/15 border border-[#FFDE00]/30 flex items-center justify-center text-[#FFDE00] flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Vibrate className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black uppercase text-white font-condensed tracking-wide flex items-center gap-1.5">
                    <span>{isRtl ? 'منبه السوار' : 'Haptic Alarm'}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        alarmSettings.enabled
                          ? 'bg-[#16EC06] shadow-[0_0_6px_rgba(22,236,6,0.8)] animate-pulse'
                          : 'bg-zinc-600'
                      }`}
                    />
                  </div>
                  <div className="text-[10px] font-mono mt-0.5 truncate flex items-center gap-1.5" dir="ltr">
                    <span className="text-white font-bold">{alarmWakeTime}</span>
                    <span className="text-zinc-600 select-none">•</span>
                    <span className={alarmSettings.enabled ? 'text-[#16EC06] font-bold' : 'text-zinc-500'}>
                      {alarmSettings.enabled
                        ? (alarmSettings.mode === 'sleep_goal'
                            ? (isRtl ? 'هدف النوم' : 'Smart Wake ON')
                            : (isRtl ? 'مفعّل' : 'Alarm ON'))
                        : (isRtl ? 'معطّل' : 'Alarm OFF')}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-zinc-500 group-hover:text-white transition-colors flex-shrink-0 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* 4. Available Protocols Selection List with Dynamic Micro-Progress & Domain Themes */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed px-1">
              {isRtl ? 'بروتوكولات الأداء المتاحة' : 'Available Protocols'}
            </h4>
            {plans.map((p) => {
              const isSelected = activePlanId === p.id;
              const theme = getProtocolTheme(p.id);

              return (
                <button
                  key={p.id}
                  onClick={() => {
                    hapticMedium();
                    setActivePlanId(p.id);
                  }}
                  className={`w-full p-4 rounded-[22px] bg-[#16191E] border transition-all duration-300 ${
                    isRtl ? 'text-right' : 'text-left'
                  } active:scale-[0.98] flex items-center justify-between gap-3 ${
                    isSelected
                      ? theme.borderActive
                      : 'border-white/5 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${theme.iconContainer}`}>
                      {p.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-condensed">
                          {p.category}
                        </span>
                        {/* Target Progress Micro-Indicator Chip */}
                        <span
                          className="text-[9px] px-1.5 py-0.2 rounded-md font-mono font-bold border"
                          style={{
                            backgroundColor: `${theme.accent}12`,
                            borderColor: `${theme.accent}30`,
                            color: theme.accent,
                          }}
                        >
                          {isRtl ? theme.progressTextAr : theme.progressTextEn}
                        </span>
                      </div>
                      <div className="text-sm font-black uppercase text-white font-condensed mt-0.5 tracking-wide truncate">
                        {p.title}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-sans mt-0.5">
                        {p.targetMetric}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isSelected ? (
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-condensed font-black tracking-wider uppercase ${theme.pillActive}`}>
                        {isRtl ? 'نشط' : 'ACTIVE'}
                      </span>
                    ) : (
                      <ChevronRight className={`w-4 h-4 text-zinc-600 ${isRtl ? 'rotate-180' : ''}`} />
                    )}
                  </div>
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
          <div className="p-4 sm:p-5 rounded-[24px] bg-[#12151A] border border-white/5 space-y-4 shadow-xl">
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
                className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-condensed border shadow-sm"
                style={{ backgroundColor: `${trainingStatus.color}15`, borderColor: `${trainingStatus.color}40`, color: trainingStatus.color }}
              >
                {isRtl ? trainingStatus.labelAr : trainingStatus.labelEn}
              </span>
            </div>

            {/* Strain vs Recovery Balance Grid */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-[#0B0D10] border border-white/5">
                <span className="text-[10px] font-condensed font-bold uppercase text-zinc-400 block">
                  {isRtl ? 'متوسط الجهد (7 أيام)' : '7-Day Avg Strain'}
                </span>
                <span className="text-3xl font-black font-condensed text-[#00A3FF] tabular-nums mt-0.5 block" dir="ltr">
                  {avgStrainNum.toFixed(1)}
                </span>
                <span className="text-[9px] text-zinc-500 font-mono">Target: 10.0 - 14.0</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0B0D10] border border-white/5">
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
                onClick={() => {
                  hapticLight();
                  onOpenDailyJournal();
                }}
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
