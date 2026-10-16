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
} from 'lucide-react';
import type { LiveMetrics, UserSettings } from '../../types/whoop';
import { useLanguage } from '../../i18n/LanguageContext';

interface PlanViewProps {
  metrics: LiveMetrics;
  settings: UserSettings;
  onOpenSleepPlanner: () => void;
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
}) => {
  const { t, isRtl } = useLanguage();
  const [subTab, setSubTab] = useState<'my_week' | 'insights' | 'overview'>('my_week');
  const [activePlanId, setActivePlanId] = useState<string>('in_the_green');

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
              <span className="text-zinc-400 font-mono">{isRtl ? 'اليوم 4 من 7' : 'DAY 4 OF 7'}</span>
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
                <span className="text-[#16EC06] font-bold">{isRtl ? 'تحقق 2 من 3 أيام' : '2 / 3 Days Achieved'}</span>
              </div>
              <div className="h-2 rounded-full bg-[#222730] overflow-hidden">
                <div className="h-full bg-[#16EC06] rounded-full w-2/3 transition-all duration-500" />
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
              onClick={() => {}}
              className={`p-3.5 rounded-[20px] bg-[#16191E] border border-white/5 hover:border-zinc-700 flex items-center justify-between transition-all active:scale-98 ${isRtl ? 'text-right' : 'text-left'}`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#16EC06]/20 flex items-center justify-center text-[#16EC06]">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase text-white font-condensed">
                    {isRtl ? 'هدف مخصص' : 'Custom Goal'}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {isRtl ? 'بناء بروتوكول' : 'Build Protocol'}
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
          <div className="p-4 rounded-2xl bg-[#16191E] border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-white font-condensed">
              <Sparkles className="w-4 h-4 text-[#00F0FF]" />
              <span>{isRtl ? 'الانتظام اليومي الأسبوعي' : 'Weekly Circadian Regularity'}</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              {isRtl
                ? 'بلغ تباين منتصف فترة نومك هذا الأسبوع 18 دقيقة فقط، مما يضعك ضمن أفضل 10% من الرياضيين الأكثر انضباطاً. يعزز الانتظام العصبي نغمة تقلب نبضات القلب (HRV) الباراسمبثاوية.'
                : 'Your sleep midpoint variance this week was 18 minutes, ranking in the top 10% of consistent athletes. Sleep regularity strongly reinforces parasympathetic HRV tone.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#16191E] border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-white font-condensed">
              <Flame className="w-4 h-4 text-[#0093E9]" />
              <span>{isRtl ? 'توزيع الجهد القلبي' : 'Cardiac Strain Distribution'}</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              {isRtl
                ? 'تم قضاء 64% من إجمالي وقت التمرين في المنطقتين 2 و 3 (القدرة الهوائية). هذا يبني كثافة الميتوكوندريا دون استنزاف مخزون التعافي الجهازي للجسم.'
                : '64% of your workout time was accumulated in Zone 2 and Zone 3 (Aerobic Power). This builds mitochondrial density without draining systemic recovery reserves.'}
            </p>
          </div>
        </div>
      )}

      {subTab === 'overview' && (
        <div className="space-y-3 p-1">
          <div className="p-4 rounded-2xl bg-[#16191E] border border-white/5 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              {isRtl ? 'ملخص المؤشرات الحيوية الشهري' : 'Monthly Biomarker Summary'}
            </h4>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-[#0B0D10] border border-white/5">
                <span className="text-[10px] text-zinc-400 uppercase font-condensed">{isRtl ? 'متوسط الجهد' : 'Avg Strain'}</span>
                <div className="text-2xl font-black font-condensed text-[#0093E9] mt-0.5" dir="ltr">
                  {metrics.dailyStrain > 0 ? metrics.dailyStrain.toFixed(1) : '--'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#0B0D10] border border-white/5">
                <span className="text-[10px] text-zinc-400 uppercase font-condensed">{isRtl ? 'متوسط التعافي' : 'Avg Recovery'}</span>
                <div className="text-2xl font-black font-condensed text-[#16EC06] mt-0.5" dir="ltr">
                  {metrics.recoveryScore !== null ? `${metrics.recoveryScore}%` : '--'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
