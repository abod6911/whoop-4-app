import React from 'react';
import type { SleepMetrics, LiveMetrics } from '../../types/whoop';
import {
  Moon,
  Clock,
  Sparkles,
  Shield,
  Activity,
  BedDouble,
  BarChart2,
  Lock,
} from 'lucide-react';

interface SleepViewProps {
  metrics: LiveMetrics;
  sleepData: SleepMetrics;
  onActivateOledNightLock: () => void;
}

export const SleepView: React.FC<SleepViewProps> = ({
  metrics,
  sleepData,
  onActivateOledNightLock,
}) => {
  // SVG parameters for large Sleep Need gauge
  const size = 180;
  const stroke = 13;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (sleepData.sleepPerformance / 100) * circ;

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300">
      {/* 1. Large Circular Sleep Performance Gauge */}
      <div className="p-6 rounded-2xl bg-whoop-card border border-whoop-border flex flex-col items-center justify-center text-center">
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#1C212B"
              strokeWidth={stroke}
              fill="transparent"
            />
            {/* Sleep Steel Blue Progress Arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#7395B7"
              strokeWidth={stroke}
              fill="transparent"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black font-condensed text-white tracking-tight tabular-nums">
              {sleepData.sleepPerformance}%
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#7395B7] font-condensed mt-0.5">
              Sleep Performance
            </span>
            <span className="text-[10px] font-bold text-whoop-gray font-condensed">
              {sleepData.hoursAsleep} hrs / {sleepData.sleepNeedHours} hrs Need
            </span>
          </div>
        </div>

        {/* OLED Night Mode Button (iPhone Special Feature) */}
        <button
          onClick={onActivateOledNightLock}
          className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-cyan-300 border border-cyan-500/30 font-black text-xs uppercase tracking-wider font-condensed shadow-lg shadow-indigo-950/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Lock className="w-4 h-4 text-cyan-400" />
          <span>Start Sleep + OLED Night Lock</span>
        </button>
      </div>

      {/* 2. Sleep Stages Horizontal Stacked Breakdown */}
      <div className="p-4 rounded-2xl bg-whoop-card border border-whoop-border space-y-3">
        <div className="flex items-center justify-between border-b border-whoop-border/60 pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
            Sleep Stages Breakdown
          </h3>
          <span className="text-[10px] font-mono text-whoop-muted">
            {sleepData.hoursInBed} HRS IN BED
          </span>
        </div>

        {/* Stacked Horizontal Bar */}
        <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-900">
          <div
            style={{ width: `${sleepData.stages.awakePercent}%` }}
            className="bg-rose-500"
            title={`Awake: ${sleepData.stages.awakePercent}%`}
          />
          <div
            style={{ width: `${sleepData.stages.remPercent}%` }}
            className="bg-cyan-400"
            title={`REM: ${sleepData.stages.remPercent}%`}
          />
          <div
            style={{ width: `${sleepData.stages.lightPercent}%` }}
            className="bg-sky-600"
            title={`Light: ${sleepData.stages.lightPercent}%`}
          />
          <div
            style={{ width: `${sleepData.stages.deepPercent}%` }}
            className="bg-indigo-700"
            title={`SWS Deep: ${sleepData.stages.deepPercent}%`}
          />
        </div>

        {/* Legend Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-condensed text-xs">
          <div className="p-2 rounded-xl bg-whoop-surface border border-whoop-border/60">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Awake</span>
            </div>
            <div className="text-base font-black text-white mt-0.5">{sleepData.stages.awakePercent}%</div>
          </div>

          <div className="p-2 rounded-xl bg-whoop-surface border border-whoop-border/60">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>REM Sleep</span>
            </div>
            <div className="text-base font-black text-white mt-0.5">{sleepData.stages.remPercent}%</div>
          </div>

          <div className="p-2 rounded-xl bg-whoop-surface border border-whoop-border/60">
            <div className="flex items-center gap-1.5 text-sky-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-sky-600" />
              <span>Light Sleep</span>
            </div>
            <div className="text-base font-black text-white mt-0.5">{sleepData.stages.lightPercent}%</div>
          </div>

          <div className="p-2 rounded-xl bg-whoop-surface border border-whoop-border/60">
            <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-indigo-700" />
              <span>Deep (SWS)</span>
            </div>
            <div className="text-base font-black text-white mt-0.5">{sleepData.stages.deepPercent}%</div>
          </div>
        </div>
      </div>

      {/* 3. Sleep Architecture & Quality Metrics */}
      <div className="p-4 rounded-2xl bg-whoop-card border border-whoop-border space-y-3 font-condensed">
        <div className="flex items-center justify-between border-b border-whoop-border/60 pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            Sleep Efficiency & Stats
          </h3>
          <span className="text-[10px] font-mono text-whoop-green">OPTIMAL</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-whoop-surface border border-whoop-border">
            <div className="text-[10px] text-whoop-muted uppercase font-bold">Efficiency</div>
            <div className="text-lg font-black text-white mt-0.5">{sleepData.efficiencyPercent}%</div>
          </div>
          <div className="p-2.5 rounded-xl bg-whoop-surface border border-whoop-border">
            <div className="text-[10px] text-whoop-muted uppercase font-bold">Latency</div>
            <div className="text-lg font-black text-white mt-0.5">{sleepData.latencyMinutes} min</div>
          </div>
          <div className="p-2.5 rounded-xl bg-whoop-surface border border-whoop-border">
            <div className="text-[10px] text-whoop-muted uppercase font-bold">Disturbances</div>
            <div className="text-lg font-black text-white mt-0.5">{sleepData.disturbancesCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
