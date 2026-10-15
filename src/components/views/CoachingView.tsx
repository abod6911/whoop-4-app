import React, { useState } from 'react';
import type { LiveMetrics, SleepMetrics, UserSettings } from '../../types/whoop';
import {
  Compass,
  Moon,
  Dumbbell,
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  ChevronRight,
  BedDouble,
  Award,
} from 'lucide-react';

interface CoachingViewProps {
  metrics: LiveMetrics;
  sleepData: SleepMetrics;
  settings: UserSettings;
  onStartActivity: () => void;
  onStartSleep: () => void;
}

export const CoachingView: React.FC<CoachingViewProps> = ({
  metrics,
  sleepData,
  settings,
  onStartActivity,
  onStartSleep,
}) => {
  const [sleepTargetTier, setSleepTargetTier] = useState<'peak' | 'perform' | 'getby'>('peak');

  const tierMultipliers = {
    peak: 1.0, // 100% need
    perform: 0.85, // 85% need
    getby: 0.70, // 70% need
  };

  const calculatedNeedHours = Number(
    (sleepData.sleepNeedHours * tierMultipliers[sleepTargetTier]).toFixed(1)
  );

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-whoop-card border border-whoop-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-whoop-blue to-whoop-green p-[1.5px] flex items-center justify-center">
          <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
            <Compass className="w-5 h-5 text-[#00B4D8]" />
          </div>
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-white font-condensed">
            WHOOP Coaching
          </h2>
          <p className="text-xs text-whoop-gray font-condensed">
            Personalized strain guidance & circadian sleep schedule
          </p>
        </div>
      </div>

      {/* 1. STRAIN COACH CARD */}
      <div className="p-5 rounded-2xl bg-whoop-card border border-whoop-border space-y-4">
        <div className="flex items-center justify-between border-b border-whoop-border/60 pb-2">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-whoop-blue" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              Strain Coach
            </h3>
          </div>
          <span className="text-[10px] font-mono text-whoop-blue">
            RECOVERY {metrics.recoveryScore}%
          </span>
        </div>

        {/* Target Range Display */}
        <div className="flex items-baseline justify-between font-condensed">
          <div>
            <div className="text-[11px] font-bold text-whoop-muted uppercase">Today's Optimal Target</div>
            <div className="text-3xl font-black text-white tabular-nums">
              {metrics.optimalStrainTarget.min} – {metrics.optimalStrainTarget.max}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-bold text-whoop-muted uppercase">Current Day Strain</div>
            <div className="text-3xl font-black text-whoop-blue tabular-nums">
              {metrics.dailyStrain.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Progress against target bar */}
        <div className="space-y-1">
          <div className="relative h-3 w-full bg-whoop-surface rounded-full overflow-hidden">
            {/* Target bracket highlighted */}
            <div
              className="absolute top-0 bottom-0 bg-white/20 rounded-full"
              style={{
                left: `${(metrics.optimalStrainTarget.min / 21) * 100}%`,
                width: `${((metrics.optimalStrainTarget.max - metrics.optimalStrainTarget.min) / 21) * 100}%`,
              }}
            />
            {/* Current progress */}
            <div
              className="h-full bg-gradient-to-r from-whoop-blue to-[#00B4D8] rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (metrics.dailyStrain / 21) * 100)}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-whoop-gray leading-relaxed">
          With a <b className="text-whoop-green">{metrics.recoveryScore}% Recovery</b>, you have high cardiovascular capacity today. Reaching at least <b>{metrics.optimalStrainTarget.min} Strain</b> will stimulate fitness adaptation.
        </p>

        <button
          onClick={onStartActivity}
          className="w-full py-2.5 rounded-xl bg-whoop-blue hover:bg-[#00B4D8] text-black font-black text-xs uppercase tracking-wider font-condensed flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-cyan-500/20"
        >
          <span>Start Workout with Strain Coach</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. SLEEP PLANNER CARD */}
      <div className="p-5 rounded-2xl bg-whoop-card border border-whoop-border space-y-4">
        <div className="flex items-center justify-between border-b border-whoop-border/60 pb-2">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-[#7395B7]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              Sleep Planner
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#7395B7]">
            NEED: {calculatedNeedHours} HRS
          </span>
        </div>

        {/* Goal Selector (Peak, Perform, Get By) */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-whoop-muted font-condensed mb-2">
            Select Tomorrow's Goal
          </label>
          <div className="grid grid-cols-3 gap-2 font-condensed text-xs">
            <button
              onClick={() => setSleepTargetTier('peak')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                sleepTargetTier === 'peak'
                  ? 'bg-[#7395B7]/25 text-white border-[#7395B7] font-black'
                  : 'bg-whoop-surface text-whoop-gray border-whoop-border hover:text-white'
              }`}
            >
              <div className="text-sm font-black">100%</div>
              <div className="text-[10px] text-whoop-muted uppercase">Peak</div>
            </button>
            <button
              onClick={() => setSleepTargetTier('perform')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                sleepTargetTier === 'perform'
                  ? 'bg-[#7395B7]/25 text-white border-[#7395B7] font-black'
                  : 'bg-whoop-surface text-whoop-gray border-whoop-border hover:text-white'
              }`}
            >
              <div className="text-sm font-black">85%</div>
              <div className="text-[10px] text-whoop-muted uppercase">Perform</div>
            </button>
            <button
              onClick={() => setSleepTargetTier('getby')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                sleepTargetTier === 'getby'
                  ? 'bg-[#7395B7]/25 text-white border-[#7395B7] font-black'
                  : 'bg-whoop-surface text-whoop-gray border-whoop-border hover:text-white'
              }`}
            >
              <div className="text-sm font-black">70%</div>
              <div className="text-[10px] text-whoop-muted uppercase">Get By</div>
            </button>
          </div>
        </div>

        {/* Sleep Need Breakdown Breakdown */}
        <div className="p-3 rounded-xl bg-whoop-surface/70 border border-whoop-border text-xs font-mono space-y-1.5">
          <div className="flex justify-between text-whoop-muted text-[11px]">
            <span>Baseline Need:</span>
            <span className="text-white">{settings.sleepNeedHours || 7.5} hrs</span>
          </div>
          <div className="flex justify-between text-whoop-muted text-[11px]">
            <span>Recent Strain Debt:</span>
            <span className="text-whoop-blue">+0.4 hrs</span>
          </div>
          <div className="flex justify-between text-whoop-muted text-[11px] border-t border-whoop-border/50 pt-1 font-bold">
            <span className="text-white font-condensed uppercase">Total Sleep Need:</span>
            <span className="text-[#7395B7]">{calculatedNeedHours} hrs</span>
          </div>
        </div>

        <button
          onClick={onStartSleep}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 font-black text-xs uppercase tracking-wider font-condensed flex items-center justify-center gap-1.5 transition-colors shadow-lg"
        >
          <span>Activate Sleep Lock</span>
          <Moon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
