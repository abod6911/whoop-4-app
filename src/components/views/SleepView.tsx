import React from 'react';
import type { SleepMetrics, LiveMetrics } from '../../types/whoop';
import {
  Moon,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';

interface SleepViewProps {
  metrics: LiveMetrics;
  sleepData: SleepMetrics;
  onActivateOledNightLock: () => void;
}

export const SleepView: React.FC<SleepViewProps> = ({
  sleepData,
  onActivateOledNightLock,
}) => {
  const size = 180;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const perf = sleepData.sleepPerformance;
  const offset = perf !== null ? circ - (perf / 100) * circ : circ;

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* 1. Large Circular Sleep Performance Gauge */}
      <div className="p-6 rounded-[20px] bg-[#16191E] border border-white/5 flex flex-col items-center justify-center text-center">
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#222730"
              strokeWidth={stroke}
              fill="transparent"
            />
            {perf !== null && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#7293B2"
                strokeWidth={stroke}
                fill="transparent"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black font-condensed text-white tracking-tight tabular-nums">
              {perf !== null ? `${perf}%` : '--'}
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#7293B2] font-condensed mt-0.5">
              Sleep Performance
            </span>
            <span className="text-[10px] font-bold text-zinc-400 font-condensed">
              {sleepData.hoursAsleep !== null ? `${sleepData.hoursAsleep} hrs` : '--'} / {sleepData.sleepNeedHours} hrs Need
            </span>
          </div>
        </div>

        {/* OLED Night Mode Button */}
        <button
          onClick={onActivateOledNightLock}
          className="mt-5 w-full py-3 px-4 rounded-xl bg-[#0B0D10] hover:bg-[#12151A] border border-[#7293B2]/30 text-[#7293B2] font-black text-xs uppercase tracking-wider font-condensed flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <Lock className="w-4 h-4 text-[#7293B2]" />
          <span>Start Sleep + OLED Night Lock</span>
        </button>
      </div>

      {/* 2. Sleep Stages Breakdown */}
      {sleepData.stages.awakePercent > 0 && (
        <div className="p-4 rounded-[20px] bg-[#16191E] border border-white/5 space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              Sleep Stages Breakdown
            </h3>
            <span className="text-[10px] font-mono text-zinc-500">
              {sleepData.hoursInBed || 8.0} HRS IN BED
            </span>
          </div>

          <div className="h-4 w-full rounded-full overflow-hidden flex bg-zinc-900">
            <div style={{ width: `${sleepData.stages.awakePercent}%` }} className="bg-rose-500" />
            <div style={{ width: `${sleepData.stages.remPercent}%` }} className="bg-[#7293B2]" />
            <div style={{ width: `${sleepData.stages.lightPercent}%` }} className="bg-[#3A4E63]" />
            <div style={{ width: `${sleepData.stages.deepPercent}%` }} className="bg-[#0093E9]" />
          </div>

          <div className="grid grid-cols-4 gap-1 text-center font-condensed text-[11px] pt-1">
            <div className="text-rose-400 font-bold">Awake ({sleepData.stages.awakePercent}%)</div>
            <div className="text-[#7293B2] font-bold">REM ({sleepData.stages.remPercent}%)</div>
            <div className="text-zinc-400 font-bold">Light ({sleepData.stages.lightPercent}%)</div>
            <div className="text-[#0093E9] font-bold">Deep ({sleepData.stages.deepPercent}%)</div>
          </div>
        </div>
      )}
    </div>
  );
};
