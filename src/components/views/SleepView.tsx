import React from 'react';
import type { SleepMetrics, LiveMetrics } from '../../types/whoop';
import {
  Moon,
  Share2,
  Lock,
  ChevronRight,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

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
  const perf = sleepData.sleepPerformance ?? 100;
  const hoursAsleep = sleepData.hoursAsleep ?? 8.3;
  const sleepNeed = sleepData.sleepNeedHours ?? 8.3;

  // 7-day chart data
  const sleepPerf7Day = [
    { day: 'Sat', perf: 92 },
    { day: 'Sun', perf: 88 },
    { day: 'Mon', perf: 95 },
    { day: 'Tue', perf: 78 },
    { day: 'Wed', perf: 85 },
    { day: 'Thu', perf: 91 },
    { day: 'Fri', perf: perf },
  ];

  const hoursVsNeed7Day = [
    { day: 'Sat', hours: 7.8, need: 8.2 },
    { day: 'Sun', hours: 8.1, need: 8.4 },
    { day: 'Mon', hours: 8.5, need: 8.0 },
    { day: 'Tue', hours: 6.9, need: 8.5 },
    { day: 'Wed', hours: 7.6, need: 8.3 },
    { day: 'Thu', hours: 8.2, need: 8.2 },
    { day: 'Fri', hours: hoursAsleep, need: sleepNeed },
  ];

  const restorative7Day = [
    { day: 'Sat', deep: 1.8, rem: 2.1 },
    { day: 'Sun', deep: 1.6, rem: 1.9 },
    { day: 'Mon', deep: 2.0, rem: 2.2 },
    { day: 'Tue', deep: 1.2, rem: 1.5 },
    { day: 'Wed', deep: 1.7, rem: 1.8 },
    { day: 'Thu', deep: 1.9, rem: 2.3 },
    { day: 'Fri', deep: 1.8, rem: 2.0 },
  ];

  const efficiency7Day = [
    { day: 'Sat', eff: 91 },
    { day: 'Sun', eff: 89 },
    { day: 'Mon', eff: 94 },
    { day: 'Tue', eff: 86 },
    { day: 'Wed', eff: 90 },
    { day: 'Thu', eff: 93 },
    { day: 'Fri', eff: 92 },
  ];

  // Time in Bed Range Bars (Bedtime at bottom, Wake time at top)
  const timeInBedRanges = [
    { day: 'Sat', bed: '11:30 PM', wake: '07:45 AM', height: 8.25 },
    { day: 'Sun', bed: '11:15 PM', wake: '08:00 AM', height: 8.75 },
    { day: 'Mon', bed: '11:00 PM', wake: '07:30 AM', height: 8.5 },
    { day: 'Tue', bed: '12:15 AM', wake: '07:15 AM', height: 7.0 },
    { day: 'Wed', bed: '11:30 PM', wake: '07:30 AM', height: 8.0 },
    { day: 'Thu', bed: '11:15 PM', wake: '07:45 AM', height: 8.5 },
    { day: 'Fri', bed: '11:15 PM', wake: '07:35 AM', height: 8.3 },
  ];

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* 1. Giant Header + Share (01:16 in Video) */}
      <div className="p-5 rounded-[24px] bg-[#12151A] border border-white/5 space-y-4 text-center">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider font-condensed text-zinc-400">
          <span>SLEEP PERFORMANCE</span>
          <button className="flex items-center gap-1 text-[#00F0FF] hover:underline">
            <Share2 className="w-3.5 h-3.5" />
            <span>SHARE</span>
          </button>
        </div>

        {/* Giant Number */}
        <div className="text-7xl font-black font-condensed text-white tracking-tight tabular-nums">
          {perf}%
        </div>

        {/* Flanked Pills: HOURS OF SLEEP vs SLEEP NEEDED */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-[#1A202A] border border-[#7293B2]/30 text-center">
            <div className="text-[10px] font-black uppercase text-[#7293B2] font-condensed">
              HOURS OF SLEEP
            </div>
            <div className="text-2xl font-black font-condensed text-white tabular-nums mt-0.5">
              8:20
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0F2618] border border-[#16EC06]/30 text-center">
            <div className="text-[10px] font-black uppercase text-[#16EC06] font-condensed">
              SLEEP NEEDED
            </div>
            <div className="text-2xl font-black font-condensed text-white tabular-nums mt-0.5">
              8:20
            </div>
          </div>
        </div>

        {/* OLED Night Lock Quick Trigger */}
        <button
          onClick={onActivateOledNightLock}
          className="w-full py-3 px-4 rounded-xl bg-[#0B0D10] hover:bg-[#16191E] border border-white/10 text-[#7293B2] font-black text-xs uppercase tracking-wider font-condensed flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <Lock className="w-4 h-4 text-[#7293B2]" />
          <span>Launch OLED Sleep Lock (Keep BLE Connected)</span>
        </button>
      </div>

      {/* 2. SLEEP STATISTICS Rows */}
      <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed px-1">
          Sleep Statistics
        </h3>

        <div className="divide-y divide-white/5">
          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <span className="text-zinc-400 uppercase">TIME IN BED</span>
            <span className="text-white font-mono font-bold">8h 47m</span>
          </div>
          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <span className="text-zinc-400 uppercase">SLEEP CONSISTENCY</span>
            <span className="text-[#16EC06] font-mono font-bold">88% Optimal</span>
          </div>
          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <span className="text-zinc-400 uppercase">RESTORATIVE SLEEP %</span>
            <span className="text-[#D946EF] font-mono font-bold">51% (SWS + REM)</span>
          </div>
          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <span className="text-zinc-400 uppercase">SLEEP DEBT</span>
            <span className="text-white font-mono font-bold">0m</span>
          </div>
        </div>
      </div>

      {/* 3. 5 Dedicated 7-Day Charts (01:22 – 01:34 in Video) */}
      <div className="space-y-4">
        {/* Chart 1: SLEEP PERFORMANCE Bar Chart */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>SLEEP PERFORMANCE (7 DAYS)</span>
            <span className="text-[10px] text-[#7293B2] font-mono">AVG: 89%</span>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepPerf7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Bar dataKey="perf" fill="#7293B2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: HOURS VS. NEED Dual Line Chart */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>HOURS VS. NEED</span>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-[#7293B2]">● Sleep</span>
              <span className="text-[#16EC06]">● Need</span>
            </div>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hoursVsNeed7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[5, 10]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Line type="monotone" dataKey="hours" stroke="#7293B2" strokeWidth={2.5} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="need" stroke="#16EC06" strokeWidth={2.5} strokeDasharray="3 3" dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: TIME IN BED Floating Range Bars */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>TIME IN BED (BEDTIME & WAKE)</span>
            <span className="text-[10px] text-zinc-400 font-mono">CIRCADIAN ALIGNMENT</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center pt-2">
            {timeInBedRanges.map((t, idx) => (
              <div key={idx} className="flex flex-col items-center justify-end h-32">
                <span className="text-[8px] font-mono text-zinc-400 mb-1">{t.wake.slice(0, 5)}</span>
                <div
                  className="w-full bg-gradient-to-t from-[#3A4E63] to-[#7293B2] rounded-lg transition-all"
                  style={{ height: `${(t.height / 10) * 100}%` }}
                />
                <span className="text-[8px] font-mono text-zinc-500 mt-1">{t.bed.slice(0, 5)}</span>
                <span className="text-[9px] font-condensed font-black text-white mt-1">{t.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: RESTORATIVE SLEEP Stacked Bars (Deep + REM) */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>RESTORATIVE SLEEP (DEEP + REM)</span>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-[#D946EF]">● Deep</span>
              <span className="text-[#7C3AED]">● REM</span>
            </div>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={restorative7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[0, 5]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Bar dataKey="deep" stackId="a" fill="#D946EF" />
                <Bar dataKey="rem" stackId="a" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: SLEEP EFFICIENCY Line Chart */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>SLEEP EFFICIENCY</span>
            <span className="text-[10px] text-[#16EC06] font-mono">AVG: 91%</span>
          </div>
          <div className="h-28 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={efficiency7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[80, 100]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Line type="monotone" dataKey="eff" stroke="#16EC06" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
