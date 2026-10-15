import React, { useState } from 'react';
import {
  X,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  Moon,
  Plus,
  Minus,
  TrendingDown,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type { LiveMetrics, UserSettings } from '../types/whoop';
import { biometricEngine } from '../utils/biometricEngine';

interface StressMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: LiveMetrics;
  settings: UserSettings;
}

export const StressMonitorModal: React.FC<StressMonitorModalProps> = ({
  isOpen,
  onClose,
  metrics,
  settings,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!isOpen) return null;

  const stressScore = metrics.stressScore ?? 0.3;
  const stressTime = new Date(metrics.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let category = 'LOW';
  let badgeColor = 'bg-[#0D3528] text-[#16EC06] border-[#16EC06]/30';
  if (stressScore >= 2.0) {
    category = 'HIGH';
    badgeColor = 'bg-[#351515] text-[#FF8A00] border-[#FF8A00]/30';
  } else if (stressScore >= 1.0) {
    category = 'MEDIUM';
    badgeColor = 'bg-[#3A2E14] text-[#FFDE00] border-[#FFDE00]/30';
  }

  // Stress timeline points
  const rawTimeline = biometricEngine.getStressTimeline();
  const timeline = rawTimeline.length > 2 ? rawTimeline : [
    { timeLabel: '12 AM', score: 0.2 },
    { timeLabel: '3 AM', score: 0.1 },
    { timeLabel: '6 AM', score: 0.2 },
    { timeLabel: '9 AM', score: 0.5 },
    { timeLabel: '12 PM', score: 0.8 },
    { timeLabel: '3 PM', score: 0.4 },
    { timeLabel: '6 PM', score: 0.6 },
    { timeLabel: 'Now', score: stressScore },
  ];

  // SVG Gauge calculations for half-circle (0.0 to 3.0)
  const size = 180;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circHalf = Math.PI * r;
  const stressRatio = Math.min(1, Math.max(0, stressScore / 3.0));
  const strokeOffset = circHalf - stressRatio * circHalf;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] bg-black border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] h-[92vh] flex flex-col overflow-hidden text-white shadow-2xl">
        {/* Top Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#16191E] text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-sm font-black uppercase tracking-wider font-condensed text-white">
            STRESS MONITOR
          </h2>

          <button
            onClick={() => {}}
            className="p-1.5 rounded-full bg-[#16191E] text-zinc-400 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Date Selector Row */}
        <div className="flex items-center justify-center gap-2 py-2 border-b border-white/5 bg-[#0B0D10]">
          <button className="text-zinc-500 hover:text-white p-1">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-black uppercase tracking-widest font-condensed text-white">
            TODAY
          </span>
          <button className="text-zinc-500 hover:text-white p-1">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Top Half-Circle Gauge (0.0 to 3.0) */}
          <div className="flex flex-col items-center justify-center text-center pt-2">
            <div className="relative flex items-center justify-center" style={{ width: size, height: size / 2 + 15 }}>
              <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
                {/* Background Half Arc */}
                <path
                  d={`M ${stroke / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${size / 2}`}
                  fill="none"
                  stroke="#1E242C"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                />
                {/* Colored Fill Arc */}
                <path
                  d={`M ${stroke / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${size / 2}`}
                  fill="none"
                  stroke="url(#stressGrad)"
                  strokeWidth={stroke}
                  strokeDasharray={circHalf}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="stressGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00F0FF" />
                    <stop offset="50%" stopColor="#FFDE00" />
                    <stop offset="100%" stopColor="#FF8A00" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Gauge Center Text */}
              <div className="absolute bottom-0 inset-x-0 flex flex-col items-center">
                <span className="text-4xl font-black font-condensed text-white tabular-nums tracking-tight">
                  {stressScore.toFixed(1)}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider font-condensed px-2 py-0.5 rounded-full border mt-1 ${badgeColor}`}>
                  {category}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-zinc-400 font-mono mt-2">
              As of {stressTime}
            </div>

            {/* Dynamic Insight Box */}
            <div className="mt-3 w-full p-3 rounded-2xl bg-[#12151A] border border-white/5 text-xs text-zinc-300 leading-relaxed text-left flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#00F0FF] flex-shrink-0 mt-0.5" />
              <p>
                {category === 'LOW'
                  ? 'Your autonomic nervous system is in a relaxed parasympathetic state. Heart rate oscillations show healthy vagal tone.'
                  : category === 'MEDIUM'
                  ? 'Moderate sympathetic arousal. Normal for daily cognitive tasks, light movement, and active routines.'
                  : 'Elevated sympathetic tone. Consider a 3-minute guided breathwork exercise to restore physiological balance.'}
              </p>
            </div>
          </div>

          {/* 24-Hour Continuous Waveform Graph */}
          <div className="rounded-2xl bg-[#12151A] border border-white/5 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider font-condensed text-white">
              <div className="flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-[#7293B2]" />
                <span>24-Hour Continuous Stress</span>
              </div>
              <button
                onClick={() => setZoomLevel((z) => (z === 1 ? 1.5 : 1))}
                className="p-1 rounded-full bg-[#1A1F26] text-zinc-400 hover:text-white"
                title="Toggle Zoom"
              >
                {zoomLevel === 1 ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="h-32 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stressAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timeLabel" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                  <YAxis domain={[0, 3]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                  <ReferenceLine y={1.0} stroke="#FFDE00" strokeDasharray="3 3" opacity={0.3} />
                  <ReferenceLine y={2.0} stroke="#FF8A00" strokeDasharray="3 3" opacity={0.3} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#00F0FF"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#stressAreaGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3 Stacked Breakdown Cards (00:27 in Video) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed px-1">
              Stress Breakdown
            </h3>

            {/* Card 1: TOTAL DAY */}
            <div className="p-3.5 rounded-2xl bg-[#12151A] border border-white/5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-black uppercase text-white font-condensed">
                <span>TOTAL DAY</span>
                <span className="text-[10px] text-zinc-400 font-mono">VS TYPICAL DAY: -12%</span>
              </div>

              {/* Stacked Bar */}
              <div className="h-2.5 rounded-full overflow-hidden flex bg-[#1E242C]">
                <div style={{ width: '65%' }} className="bg-[#00F0FF]" title="Low" />
                <div style={{ width: '25%' }} className="bg-[#FFDE00]" title="Medium" />
                <div style={{ width: '10%' }} className="bg-[#FF8A00]" title="High" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono pt-1">
                <div>
                  <div className="text-zinc-500 uppercase font-sans text-[9px]">LOW</div>
                  <div className="text-white font-bold">14h 10m</div>
                </div>
                <div>
                  <div className="text-zinc-500 uppercase font-sans text-[9px]">MEDIUM</div>
                  <div className="text-white font-bold">2h 45m</div>
                </div>
                <div>
                  <div className="text-zinc-500 uppercase font-sans text-[9px]">HIGH</div>
                  <div className="text-white font-bold">45m</div>
                </div>
              </div>
            </div>

            {/* Card 2: NON ACTIVITY */}
            <div className="p-3.5 rounded-2xl bg-[#12151A] border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-black uppercase text-white font-condensed">
                <span>NON ACTIVITY</span>
                <span className="text-[10px] text-[#16EC06] font-mono">0.4 AVG</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                Stress experienced outside of recorded Strain activities and sleep.
              </p>
            </div>

            {/* Card 3: SLEEP */}
            <div className="p-3.5 rounded-2xl bg-[#12151A] border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-black uppercase text-white font-condensed">
                <span>SLEEP</span>
                <span className="text-[10px] text-[#7293B2] font-mono">0.1 AVG</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                Stress experienced during sleep. Reflects nocturnal autonomic recovery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
