import React, { useState } from 'react';
import {
  X,
  Moon,
  MoreHorizontal,
  Info,
  Clock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import type { LiveMetrics, SleepMetrics } from '../types/whoop';

interface SleepStageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: LiveMetrics;
  sleepData?: SleepMetrics;
}

type StageType = 'all' | 'awake' | 'light' | 'deep' | 'rem';

interface SleepTimelinePoint {
  time: string;
  hr: number;
  stage: 'awake' | 'light' | 'deep' | 'rem';
}

export const SleepStageDetailModal: React.FC<SleepStageDetailModalProps> = ({
  isOpen,
  onClose,
  metrics,
  sleepData,
}) => {
  const [selectedStage, setSelectedStage] = useState<StageType>('all');

  if (!isOpen) return null;

  // Realistic Overnight Heart Rate & Hypnogram Data
  const hypnogramData: SleepTimelinePoint[] = [
    { time: '11:15 PM', hr: 68, stage: 'awake' },
    { time: '11:45 PM', hr: 58, stage: 'light' },
    { time: '12:15 AM', hr: 52, stage: 'deep' },
    { time: '12:45 AM', hr: 50, stage: 'deep' },
    { time: '01:15 AM', hr: 55, stage: 'rem' },
    { time: '01:45 AM', hr: 54, stage: 'light' },
    { time: '02:15 AM', hr: 49, stage: 'deep' },
    { time: '02:45 AM', hr: 48, stage: 'deep' },
    { time: '03:15 AM', hr: 56, stage: 'rem' },
    { time: '03:45 AM', hr: 62, stage: 'awake' },
    { time: '04:15 AM', hr: 53, stage: 'light' },
    { time: '04:45 AM', hr: 51, stage: 'deep' },
    { time: '05:15 AM', hr: 57, stage: 'rem' },
    { time: '05:45 AM', hr: 54, stage: 'light' },
    { time: '06:15 AM', hr: 58, stage: 'rem' },
    { time: '06:45 AM', hr: 55, stage: 'light' },
    { time: '07:15 AM', hr: 65, stage: 'awake' },
    { time: '07:35 AM', hr: 70, stage: 'awake' },
  ];

  // Stage Color map
  const STAGE_COLORS = {
    awake: '#E4E4E7', // White/Gray
    light: '#A855F7', // Light Purple
    deep: '#D946EF',  // Pink/Magenta
    rem: '#7C3AED',   // Deep Purple
  };

  const STAGE_NAMES = {
    awake: 'AWAKE',
    light: 'LIGHT',
    deep: 'SWS (DEEP)',
    rem: 'REM',
  };

  const stagesSummary = {
    awake: { duration: '0h 42m', pct: '8%', typical: '5% - 10%' },
    light: { duration: '3h 52m', pct: '46%', typical: '40% - 55%' },
    deep: { duration: '1h 50m', pct: '22%', typical: '15% - 25%' },
    rem: { duration: '2h 01m', pct: '24%', typical: '20% - 25%' },
  };

  const getFilteredChartData = () => {
    return hypnogramData.map((d) => {
      const isHighlighted = selectedStage === 'all' || d.stage === selectedStage;
      return {
        ...d,
        activeHr: isHighlighted ? d.hr : null,
        dimHr: !isHighlighted ? d.hr : null,
      };
    });
  };

  const chartData = getFilteredChartData();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] bg-black border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] h-[92vh] flex flex-col overflow-hidden text-white shadow-2xl">
        {/* Top Bar */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#16191E] text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider font-condensed text-white">
              <Moon className="w-3.5 h-3.5 text-[#7293B2]" />
              <span>SLEEP</span>
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">
              11:15 PM – 7:35 AM
            </div>
          </div>

          <button className="p-1.5 rounded-full bg-[#16191E] text-zinc-400 hover:text-white">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Headline Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#12151A] border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-condensed">
                HOURS OF SLEEP
              </span>
              <div className="text-3xl font-black font-condensed text-white tabular-nums mt-1">
                8:20
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                100% of Sleep Need
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#12151A] border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-condensed">
                RESTORATIVE SLEEP
              </span>
              <div className="text-3xl font-black font-condensed text-[#D946EF] tabular-nums mt-1">
                4:15
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                51% (SWS Deep + REM)
              </span>
            </div>
          </div>

          {/* Insight Box */}
          <div className="p-3 rounded-2xl bg-[#12151A] border border-white/5 text-xs text-zinc-300 leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#7293B2] flex-shrink-0 mt-0.5" />
            <p>
              Optimal sleep architecture. Restorative sleep (SWS Deep + REM) was 51% of total sleep time, ensuring complete cellular tissue repair and neural memory consolidation.
            </p>
          </div>

          {/* Interactive Overnight Heart Rate Graph */}
          <div className="rounded-2xl bg-[#12151A] border border-white/5 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider font-condensed text-white">
              <span>Overnight Heart Rate & Stages</span>
              {selectedStage !== 'all' && (
                <button
                  onClick={() => setSelectedStage('all')}
                  className="text-[10px] text-[#00F0FF] hover:underline"
                >
                  Reset Filter
                </button>
              )}
            </div>

            <div className="h-32 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sleepHrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={selectedStage === 'all' ? '#7293B2' : STAGE_COLORS[selectedStage]}
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor={selectedStage === 'all' ? '#7293B2' : STAGE_COLORS[selectedStage]}
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#52525B" tick={{ fontSize: 8 }} tickLine={false} />
                  <YAxis domain={[40, 80]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                  {/* Dim background curve for unselected stages */}
                  <Area
                    type="monotone"
                    dataKey="dimHr"
                    stroke="#3F3F46"
                    strokeWidth={1}
                    fillOpacity={0}
                    connectNulls={false}
                  />
                  {/* Active highlighted curve */}
                  <Area
                    type="monotone"
                    dataKey="activeHr"
                    stroke={selectedStage === 'all' ? '#7293B2' : STAGE_COLORS[selectedStage]}
                    strokeWidth={2.5}
                    fill="url(#sleepHrGrad)"
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4 Interactive Striped Stage Bars (00:40 in Video) */}
          <div className="space-y-2.5">
            <div className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed px-1">
              Sleep Stages (Tap to filter graph)
            </div>

            {(['awake', 'light', 'deep', 'rem'] as (keyof typeof stagesSummary)[]).map((stageKey) => {
              const isSelected = selectedStage === stageKey;
              const color = STAGE_COLORS[stageKey];
              const summary = stagesSummary[stageKey];

              return (
                <button
                  key={stageKey}
                  onClick={() => setSelectedStage(isSelected ? 'all' : stageKey)}
                  className={`w-full p-3 rounded-2xl bg-[#12151A] border transition-all text-left active:scale-98 ${
                    isSelected ? 'border-white/40 ring-1 ring-white/20' : 'border-white/5 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-black font-condensed">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-white uppercase">{STAGE_NAMES[stageKey]}</span>
                    </div>
                    <div className="space-x-2 font-mono text-[11px]">
                      <span className="text-white font-bold">{summary.duration}</span>
                      <span className="text-zinc-400">({summary.pct})</span>
                    </div>
                  </div>

                  {/* Striped Typical Range Bar */}
                  <div className="mt-2 h-2 rounded-full overflow-hidden relative bg-[#1E242C]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: summary.pct,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <div className="text-[9px] text-zinc-500 font-mono mt-1 text-right">
                    TYPICAL: {summary.typical}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Horizontal Scrollable Sleep Metrics (00:47 in Video) */}
          <div className="space-y-2 pt-1">
            <div className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed px-1">
              Additional Sleep Vitals
            </div>

            <div className="overflow-x-auto flex gap-3 no-scrollbar pb-2">
              {/* Card 1: Wake Events */}
              <div className="min-w-[150px] p-3.5 rounded-2xl bg-[#12151A] border border-white/5 space-y-1">
                <span className="text-[10px] font-black uppercase text-zinc-400 font-condensed">
                  WAKE EVENTS
                </span>
                <div className="text-2xl font-black font-condensed text-white tabular-nums">
                  1.2
                  <span className="text-xs font-sans text-zinc-400 font-normal ml-1">/ hr</span>
                </div>
                <span className="text-[9px] text-[#16EC06] font-mono">Low disturbance</span>
              </div>

              {/* Card 2: Sleep Efficiency */}
              <div className="min-w-[150px] p-3.5 rounded-2xl bg-[#12151A] border border-white/5 space-y-1">
                <span className="text-[10px] font-black uppercase text-zinc-400 font-condensed">
                  EFFICIENCY
                </span>
                <div className="text-2xl font-black font-condensed text-white tabular-nums">
                  92%
                </div>
                <span className="text-[9px] text-[#16EC06] font-mono">Restful duration</span>
              </div>

              {/* Card 3: Respiratory Rate */}
              <div className="min-w-[150px] p-3.5 rounded-2xl bg-[#12151A] border border-white/5 space-y-1">
                <span className="text-[10px] font-black uppercase text-zinc-400 font-condensed">
                  RESPIRATORY RATE
                </span>
                <div className="text-2xl font-black font-condensed text-white tabular-nums">
                  {metrics.respiratoryRate ?? '14.2'}
                  <span className="text-xs font-sans text-zinc-400 font-normal ml-1">rpm</span>
                </div>
                <span className="text-[9px] text-[#16EC06] font-mono">Baseline consistent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
