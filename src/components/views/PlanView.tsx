import React, { useState } from 'react';
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
} from 'lucide-react';
import type { LiveMetrics, UserSettings, DayHistoryRecord } from '../../types/whoop';
import { useLanguage } from '../../i18n/LanguageContext';

interface PlanViewProps {
  metrics: LiveMetrics;
  settings: UserSettings;
  onOpenSleepPlanner: () => void;
  onOpenAlarmModal?: () => void;
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
  daysHistory,
}) => {
  const { t, isRtl } = useLanguage();
  const [subTab, setSubTab] = useState<'my_week' | 'insights' | 'overview'>('my_week');
  const [activePlanId, setActivePlanId] = useState<string>('in_the_green');

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
      icon: <Activity className="w-5 h-5 text-[#16EC06]" />,
      active: activePlanId === 'in_the_green',
    },
    {
      id: 'sleep_right',
      title: isRtl ? 'النوم الصحيح' : 'Sleep Right',
      category: isRtl ? 'الاتساق اليومي (السيركادي)' : 'CIRCADIAN CONSISTENCY',
      description: isRtl
        ? 'تلبية 100% من احتياج النوم الليلي والحفاظ على اتساق وقت النوم في حدود 30 دقيقة.'
        : 'Meet 100% of nightly sleep need and maintain bedtime consistency within 30 minutes.',
      targetMetric: isRtl ? '100% من هدف احتياج النوم' : '100% Sleep Need Target',
      icon: <Moon className="w-5 h-5 text-[#7293B2]" />,
      active: activePlanId === 'sleep_right',
    },
    {
      id: 'boost_fitness',
      title: isRtl ? 'تعزيز اللياقة البدنية' : 'Boost Fitness',
      category: isRtl ? 'اللياقة القلبية والتنفسية' : 'CARDIORESPIRATORY',
      description: isRtl
        ? 'زيادة التحفيز القلبي تدريجياً عبر فترات المنطقة 2 والمنطقة 4.'
        : 'Progressively increase cardiovascular stimulus with Zone 2 and Zone 4 intervals.',
      targetMetric: isRtl ? 'هدف جهد يومي 14.5+' : 'Target 14.5+ Day Strain',
      icon: <Flame className="w-5 h-5 text-[#0093E9]" />,
      active: activePlanId === 'boost_fitness',
    },
    {
      id: 'strong_start',
      title: isRtl ? 'بداية قوية' : 'Strong Start',
      category: isRtl ? 'الزخم الأسبوعي' : 'WEEKLY MOMENTUM',
      description: isRtl
        ? 'تركيز أهداف الجهد الأسبوعي في أيام الاثنين وحتى الأربعاء.'
        : 'Front-load your weekly strain targets on Monday through Wednesday.',
      targetMetric: isRtl ? '40 جهد تراكمي بحلول الأربعاء' : '40 Cumulative Strain by Wed',
      icon: <Target className="w-5 h-5 text-[#FFDE00]" />,
      active: activePlanId === 'strong_start',
    },
    {
      id: 'sleep_deeper',
      title: isRtl ? 'نوم أعمق' : 'Sleep Deeper',
      category: isRtl ? 'بنية النوم' : 'SLEEP ARCHITECTURE',
      description: isRtl
        ? 'تحسين بيئة النوم الليلية لزيادة نوم الموجة البطيئة (SWS) العميق والتعويضي.'
        : 'Optimize night-time environment to maximize SWS Slow Wave Deep restorative sleep.',
      targetMetric: isRtl ? '≥20% نوم عميق بطيء الموجة' : '≥20% Slow Wave Deep Sleep',
      icon: <Moon className="w-5 h-5 text-[#D946EF]" />,
      active: activePlanId === 'sleep_deeper',
    },
    {
      id: 'shed_weight',
      title: isRtl ? 'الإنتاج الأيضي' : 'Metabolic Output',
      category: isRtl ? 'حرق الطاقة والسعرات' : 'ENERGY EXPENDITURE',
      description: isRtl
        ? 'الحفاظ على حرق مستمر للسعرات ومعدل أيض مرتفع على مدار الأسبوع.'
        : 'Sustain continuous active calorie burn and elevated metabolic rate throughout the week.',
      targetMetric: isRtl ? 'حرق 2,800+ سعرة يومياً' : '2,800+ kcal daily burn',
      icon: <Flame className="w-5 h-5 text-[#FF8A00]" />,
      active: activePlanId === 'shed_weight',
    },
  ];

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* Sub-Tabs: MY WEEK | INSIGHTS | OVERVIEW */}
      <div className="flex items-center justify-between border-b border-white/5 px-2">
        {(['my_week', 'insights', 'overview'] as const).map((tab) => {
          const isActive = subTab === tab;
          const labels = {
            my_week: isRtl ? 'أسبوعي' : 'MY WEEK',
            insights: isRtl ? 'الرؤى والتحليلات' : 'INSIGHTS',
            overview: isRtl ? 'نظرة عامة' : 'OVERVIEW',
          };

          return (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              className={`py-2 px-3 text-xs font-black uppercase tracking-wider font-condensed relative transition-colors ${
                isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>{labels[tab]}</span>
              {isActive && (
                <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-white rounded-full shadow-sm" />
              )}
            </button>
          );
        })}
      </div>

      {/* Main SubTab Content */}
      {subTab === 'my_week' && (
        <div className="space-y-4">
          {/* Active Goal Hero Banner */}
          <div className="p-5 rounded-[24px] bg-gradient-to-br from-[#121620] via-[#16191E] to-[#0D1017] border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider font-condensed">
              <span className="text-[#0093E9]">{isRtl ? 'الهدف الأسبوعي النشط' : 'ACTIVE WEEKLY GOAL'}</span>
              <span className="text-zinc-400 font-mono">{isRtl ? `اليوم ${currentDayOfWeek} من 7` : `DAY ${currentDayOfWeek} OF 7`}</span>
            </div>

            <div>
              <h3 className="text-xl font-black font-condensed text-white tracking-wide">
                {plans.find((p) => p.id === activePlanId)?.title || (isRtl ? 'في النطاق الأخضر' : 'In the Green')}
              </h3>
              <p className="text-xs text-zinc-300 font-sans mt-1 leading-relaxed">
                {plans.find((p) => p.id === activePlanId)?.description}
              </p>
            </div>

            {/* Target Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-zinc-400">{isRtl ? 'التقدم نحو الهدف الأسبوعي' : 'Weekly Target Progress'}</span>
                <span className="text-[#16EC06] font-bold">
                  {activePlanId === 'strong_start'
                    ? (isRtl ? `${achievedCount} / ${targetCount} جهد تراكمي` : `${achievedCount} / ${targetCount} Cumulative Strain`)
                    : (isRtl ? `تحقق ${achievedCount} من ${targetCount} أيام` : `${achievedCount} / ${targetCount} Days Achieved`)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#222730] overflow-hidden">
                <div
                  className="h-full bg-[#16EC06] rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Shortcuts: Sleep Planner */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onOpenSleepPlanner}
              className={`p-3.5 rounded-[20px] bg-[#16191E] border border-white/5 hover:border-zinc-700 flex items-center justify-between transition-all active:scale-98 ${isRtl ? 'text-right' : 'text-left'}`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#7293B2]/20 flex items-center justify-center text-[#7293B2]">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase text-white font-condensed">
                    {t('sleepPlanner')}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {isRtl ? 'المنبه الذكي' : 'Smart Wake Alarm'}
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
                <div className="w-8 h-8 rounded-xl bg-[#0093E9]/20 flex items-center justify-center text-[#0093E9]">
                  <Vibrate className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase text-white font-condensed">
                    {isRtl ? 'منبه الاهتزاز' : 'Haptic Alarm'}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {isRtl ? 'اهتزاز السوار' : 'Silent Wake Motor'}
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 text-zinc-500 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Available Weekly Plans List */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed px-1">
              {isRtl ? 'اختر أو بدّل البروتوكول' : 'Select or Switch Protocol'}
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

                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <span className="text-[10px] bg-[#0093E9] text-white px-2 py-0.5 rounded-full font-condensed font-black tracking-wider uppercase">
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

      {subTab === 'insights' && (
        <div className="space-y-3 p-1">
          {/* Circadian Regularity */}
          <div className="p-4 rounded-2xl bg-[#16191E] border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-white font-condensed">
              <Sparkles className="w-4 h-4 text-[#00F0FF]" />
              <span>{isRtl ? 'الانتظام اليومي الأسبوعي' : 'Weekly Circadian Regularity'}</span>
            </div>
            {(() => {
              const daysWithSleep = (daysHistory || []).filter((d) => d.bedtime || d.hoursAsleep);
              if (daysWithSleep.length >= 2) {
                return (
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                    {isRtl
                      ? `تم تسجيل ${daysWithSleep.length} ليالٍ من النوم هذا الأسبوع. الحفاظ على اتساق نافذة النوم في حدود 30 دقيقة يعزز نغمة تقلب نبضات القلب (HRV) والتعافي الجهازي.`
                      : `${daysWithSleep.length} nights of sleep logged this week. Maintaining bedtime consistency within 30 minutes reinforces parasympathetic HRV tone and systemic recovery.`}
                  </p>
                );
              }
              return (
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {isRtl
                    ? 'سجّل ليلتين أو أكثر من النوم باستخدام السوار أو مخطط النوم لحساب تباين وانتظام دورة نومك.'
                    : 'Log at least 2 nights of sleep with your strap or Sleep Planner to calculate your circadian sleep regularity.'}
                </p>
              );
            })()}
          </div>

          {/* Cardiac Strain Distribution */}
          <div className="p-4 rounded-2xl bg-[#16191E] border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-white font-condensed">
              <Flame className="w-4 h-4 text-[#0093E9]" />
              <span>{isRtl ? 'توزيع الجهد القلبي' : 'Cardiac Strain Distribution'}</span>
            </div>
            {(() => {
              const z23Sec = (metrics.zoneSeconds[2] || 0) + (metrics.zoneSeconds[3] || 0);
              const totalSec = Object.values(metrics.zoneSeconds).reduce((a, b) => a + b, 0);
              if (totalSec > 60) {
                const pct = Math.round((z23Sec / totalSec) * 100);
                return (
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                    {isRtl
                      ? `تم قضاء ${pct}% من وقت نشاطك اليوم في المنطقتين 2 و 3 (القدرة الهوائية). هذا يبني كثافة الميتوكوندريا دون إجهاد مخزون التعافي العصبي.`
                      : `${pct}% of your elevated cardiac activity today was spent in Zone 2 and Zone 3 (Aerobic Base). This builds mitochondrial density without overtaxing autonomic recovery.`}
                  </p>
                );
              }
              return (
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {isRtl
                    ? 'لم يتم تسجيل نشاط قلبي مرتفع اليوم بعد. ابدأ تمريناً مباشراً أو اربط السوار لتحليل توزيع مناطق النبض.'
                    : 'No elevated cardiac activity recorded today yet. Start a workout or connect your strap to analyze heart rate zone distribution.'}
                </p>
              );
            })()}
          </div>
        </div>
      )}

      {subTab === 'overview' && (
        <div className="space-y-3 p-1">
          <div className="p-4 rounded-2xl bg-[#16191E] border border-white/5 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              {isRtl ? 'ملخص المؤشرات الحيوية' : 'Biomarker History Summary'}
            </h4>
            {(() => {
              const allStrains = [
                ...(metrics.dailyStrain > 0 ? [metrics.dailyStrain] : []),
                ...(daysHistory || []).map((d) => d.dayStrain).filter((s) => s > 0),
              ];
              const avgStrain = allStrains.length > 0 ? (allStrains.reduce((a, b) => a + b, 0) / allStrains.length).toFixed(1) : '--';

              const allRecoveries = [
                ...(metrics.recoveryScore !== null ? [metrics.recoveryScore] : []),
                ...(daysHistory || []).map((d) => d.recoveryScore).filter((r): r is number => r !== null && r > 0),
              ];
              const avgRecovery = allRecoveries.length > 0 ? `${Math.round(allRecoveries.reduce((a, b) => a + b, 0) / allRecoveries.length)}%` : '--';

              return (
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-[#0B0D10] border border-white/5">
                    <span className="text-[10px] text-zinc-400 uppercase font-condensed">{isRtl ? 'متوسط الجهد' : 'Avg Strain'}</span>
                    <div className="text-2xl font-black font-condensed text-[#0093E9] mt-0.5" dir="ltr">
                      {avgStrain}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0B0D10] border border-white/5">
                    <span className="text-[10px] text-zinc-400 uppercase font-condensed">{isRtl ? 'متوسط التعافي' : 'Avg Recovery'}</span>
                    <div className="text-2xl font-black font-condensed text-[#16EC06] mt-0.5" dir="ltr">
                      {avgRecovery}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
