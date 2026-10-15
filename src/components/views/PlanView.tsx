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
  const [subTab, setSubTab] = useState<'my_week' | 'insights' | 'overview'>('my_week');
  const [activePlanId, setActivePlanId] = useState<string>('in_the_green');

  const plans: PlanCard[] = [
    {
      id: 'in_the_green',
      title: 'In the Green',
      category: 'RECOVERY & READINESS',
      description: 'Prioritize restorative lifestyle habits to achieve 3+ Green Recovery days this week.',
      targetMetric: '≥67% Recovery on 3+ Days',
      icon: <Activity className="w-5 h-5 text-[#16EC06]" />,
      active: activePlanId === 'in_the_green',
    },
    {
      id: 'sleep_right',
      title: 'Sleep Right',
      category: 'CIRCADIAN CONSISTENCY',
      description: 'Meet 100% of nightly sleep need and maintain bedtime consistency within 30 minutes.',
      targetMetric: '100% Sleep Need Target',
      icon: <Moon className="w-5 h-5 text-[#7293B2]" />,
      active: activePlanId === 'sleep_right',
    },
    {
      id: 'boost_fitness',
      title: 'Boost Fitness',
      category: 'CARDIORESPIRATORY',
      description: 'Progressively increase cardiovascular stimulus with Zone 2 and Zone 4 intervals.',
      targetMetric: 'Target 14.5+ Day Strain',
      icon: <Flame className="w-5 h-5 text-[#0093E9]" />,
      active: activePlanId === 'boost_fitness',
    },
    {
      id: 'strong_start',
      title: 'Strong Start',
      category: 'WEEKLY MOMENTUM',
      description: 'Front-load your weekly strain targets on Monday through Wednesday.',
      targetMetric: '40 Cumulative Strain by Wed',
      icon: <Target className="w-5 h-5 text-[#FFDE00]" />,
      active: activePlanId === 'strong_start',
    },
    {
      id: 'sleep_deeper',
      title: 'Sleep Deeper',
      category: 'SLEEP ARCHITECTURE',
      description: 'Optimize night-time environment to maximize SWS Slow Wave Deep restorative sleep.',
      targetMetric: '≥20% Slow Wave Deep Sleep',
      icon: <Moon className="w-5 h-5 text-[#D946EF]" />,
      active: activePlanId === 'sleep_deeper',
    },
    {
      id: 'shed_weight',
      title: 'Metabolic Output',
      category: 'ENERGY EXPENDITURE',
      description: 'Sustain continuous active calorie burn and elevated metabolic rate throughout the week.',
      targetMetric: '2,800+ kcal daily burn',
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
            my_week: 'MY WEEK',
            insights: 'INSIGHTS',
            overview: 'OVERVIEW',
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
              <span className="text-[#0093E9]">ACTIVE WEEKLY GOAL</span>
              <span className="text-zinc-400 font-mono">DAY 4 OF 7</span>
            </div>

            <div>
              <h3 className="text-xl font-black font-condensed text-white tracking-wide">
                {plans.find((p) => p.id === activePlanId)?.title || 'In the Green'}
              </h3>
              <p className="text-xs text-zinc-300 font-sans mt-1 leading-relaxed">
                {plans.find((p) => p.id === activePlanId)?.description}
              </p>
            </div>

            {/* Target Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-zinc-400">Weekly Target Progress</span>
                <span className="text-[#16EC06] font-bold">2 / 3 Days Achieved</span>
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
              className="p-3.5 rounded-[20px] bg-[#16191E] border border-white/5 hover:border-zinc-700 flex items-center justify-between transition-all active:scale-98 text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#7293B2]/20 flex items-center justify-center text-[#7293B2]">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase text-white font-condensed">
                    Sleep Planner
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    Smart Wake Alarm
                  </div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
            </button>

            <button
              onClick={() => {}}
              className="p-3.5 rounded-[20px] bg-[#16191E] border border-white/5 hover:border-zinc-700 flex items-center justify-between transition-all active:scale-98 text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#16EC06]/20 flex items-center justify-center text-[#16EC06]">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase text-white font-condensed">
                    Custom Goal
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    Build Protocol
                  </div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          </div>

          {/* Available Weekly Plans List */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed px-1">
              Select or Switch Protocol
            </h4>

            {plans.map((p) => {
              const isSelected = activePlanId === p.id;

              return (
                <button
                  key={p.id}
                  onClick={() => setActivePlanId(p.id)}
                  className={`w-full p-4 rounded-[22px] bg-[#16191E] border transition-all text-left active:scale-98 flex items-center justify-between gap-3 ${
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
                        ACTIVE
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-600" />
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
              <span>Weekly Circadian Regularity</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              Your sleep midpoint variance this week was 18 minutes, ranking in the top 10% of consistent athletes. Sleep regularity strongly reinforces parasympathetic HRV tone.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#16191E] border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-white font-condensed">
              <Flame className="w-4 h-4 text-[#0093E9]" />
              <span>Cardiac Strain Distribution</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              64% of your workout time was accumulated in Zone 2 and Zone 3 (Aerobic Power). This builds mitochondrial density without draining systemic recovery reserves.
            </p>
          </div>
        </div>
      )}

      {subTab === 'overview' && (
        <div className="space-y-3 p-1">
          <div className="p-4 rounded-2xl bg-[#16191E] border border-white/5 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              Monthly Biomarker Summary
            </h4>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-[#0B0D10] border border-white/5">
                <span className="text-[10px] text-zinc-400 uppercase font-condensed">Avg Strain</span>
                <div className="text-2xl font-black font-condensed text-[#0093E9] mt-0.5">12.8</div>
              </div>
              <div className="p-3 rounded-xl bg-[#0B0D10] border border-white/5">
                <span className="text-[10px] text-zinc-400 uppercase font-condensed">Avg Recovery</span>
                <div className="text-2xl font-black font-condensed text-[#16EC06] mt-0.5">74%</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
