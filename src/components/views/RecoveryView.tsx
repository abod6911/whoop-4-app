import React, { useState } from 'react';
import type { LiveMetrics, UserSettings } from '../../types/whoop';
import {
  Activity,
  Heart,
  ShieldCheck,
  Timer,
  ChevronRight,
  TrendingUp,
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
  ReferenceLine,
  Cell,
} from 'recharts';

interface RecoveryViewProps {
  metrics: LiveMetrics;
  settings: UserSettings;
  onOpenRecoveryTest: () => void;
}

export const getRecoveryColor = (score: number) => {
  if (score >= 67) return '#16EC06';
  if (score >= 34) return '#FFDE00';
  return '#FF0026';
};

export const getRecoveryCategory = (score: number): 'green' | 'yellow' | 'red' => {
  if (score >= 67) return 'green';
  if (score >= 34) return 'yellow';
  return 'red';
};

export const RecoveryView: React.FC<RecoveryViewProps> = ({
  metrics,
  settings,
  onOpenRecoveryTest,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'recovery' | 'hrv'>('recovery');

  const recoveryColor = getRecoveryColor(metrics.recoveryScore);
  const category = getRecoveryCategory(metrics.recoveryScore);

  // SVG parameters for large Recovery ring
  const size = 180;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (metrics.recoveryScore / 100) * circ;

  // 7-Day Trend data
  const trendData = [
    { day: 'FRI', date: 'Oct 10', recovery: 68, hrv: 64, rhr: 54 },
    { day: 'SAT', date: 'Oct 11', recovery: 74, hrv: 69, rhr: 52 },
    { day: 'SUN', date: 'Oct 12', recovery: 85, hrv: 74, rhr: 50 },
    { day: 'MON', date: 'Oct 13', recovery: 61, hrv: 62, rhr: 53 },
    { day: 'TUE', date: 'Oct 14', recovery: 54, hrv: 58, rhr: 54 },
    { day: 'WED', date: 'Oct 15', recovery: 31, hrv: 44, rhr: 58 },
    { day: 'TODAY', date: 'Oct 16', recovery: metrics.recoveryScore, hrv: metrics.currentHrv, rhr: metrics.restingHr },
  ];

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      {/* 1. Large Circular Recovery Gauge */}
      <div className="p-6 rounded-2xl bg-[#101318] border border-[#1E232D] flex flex-col items-center justify-center text-center">
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
            {/* Recovery Progress Arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={recoveryColor}
              strokeWidth={stroke}
              fill="transparent"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-5xl font-black font-condensed tracking-tight tabular-nums"
              style={{ color: recoveryColor }}
            >
              {metrics.recoveryScore}%
            </span>
            <span
              className="text-xs font-black uppercase tracking-widest font-condensed mt-1"
              style={{ color: recoveryColor }}
            >
              {category.toUpperCase()} RECOVERY
            </span>
          </div>
        </div>

        {/* Status text */}
        <div className="mt-4 text-xs text-zinc-400 font-sans max-w-[320px] leading-relaxed">
          {category === 'green'
            ? 'Your body is primed to take on high strain. Optimal autonomic balance and elevated HRV.'
            : category === 'yellow'
            ? 'Your autonomic nervous system is in steady balance. Moderate strain is recommended.'
            : 'Your body is fatigued and recovering. Prioritize rest, hydration, and restorative sleep.'}
        </div>

        {/* Action Button: Morning Recovery Assessment (Clean Black Capsule Style) */}
        <button
          onClick={onOpenRecoveryTest}
          className="mt-5 w-full py-3 px-4 rounded-xl bg-[#12151A] hover:bg-[#181C23] border border-[#2A303C] transition-all flex items-center justify-center gap-2 active:scale-98"
        >
          <Timer className="w-4 h-4 text-zinc-300" />
          <span className="text-xs font-black uppercase tracking-wider text-white font-condensed">
            Measure Morning Recovery (3-Min HRV)
          </span>
        </button>
      </div>

      {/* 2. Interactive Recharts 7-Day Trend Card */}
      <div className="p-4 rounded-2xl bg-[#101318] border border-[#1E232D] space-y-3">
        <div className="flex items-center justify-between border-b border-[#1E232D] pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              7-Day Recovery Trends
            </h3>
          </div>

          {/* Toggle Tab */}
          <div className="flex items-center bg-[#181C23] p-0.5 rounded-lg border border-[#262B35]">
            <button
              onClick={() => setActiveChartTab('recovery')}
              className={`px-2 py-0.5 text-[10px] font-black uppercase font-condensed rounded ${
                activeChartTab === 'recovery'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Recovery %
            </button>
            <button
              onClick={() => setActiveChartTab('hrv')}
              className={`px-2 py-0.5 text-[10px] font-black uppercase font-condensed rounded ${
                activeChartTab === 'hrv'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              HRV ms
            </button>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-44 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            {activeChartTab === 'recovery' ? (
              <BarChart data={trendData} margin={{ top: 18, right: 8, left: -24, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  stroke="#52525B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#27272A' }}
                  fontFamily="'Barlow Condensed', sans-serif"
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#52525B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#27272A' }}
                  ticks={[33, 66, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#12151A',
                    borderColor: '#262B35',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                    fontFamily: "'Barlow Condensed', sans-serif",
                  }}
                  formatter={(val: unknown) => [`${val}%`, 'Recovery']}
                />
                <ReferenceLine
                  y={67}
                  stroke="#16EC06"
                  strokeDasharray="3 3"
                  label={{ value: 'GREEN (67%)', fill: '#16EC06', fontSize: 9, position: 'right' }}
                />
                <ReferenceLine
                  y={34}
                  stroke="#FFDE00"
                  strokeDasharray="3 3"
                  label={{ value: 'YELLOW (34%)', fill: '#FFDE00', fontSize: 9, position: 'right' }}
                />
                <Bar dataKey="recovery" radius={[4, 4, 0, 0]}>
                  {trendData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getRecoveryColor(entry.recovery)} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={trendData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  stroke="#52525B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#27272A' }}
                  fontFamily="'Barlow Condensed', sans-serif"
                />
                <YAxis
                  domain={['dataMin - 10', 'dataMax + 10']}
                  stroke="#52525B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#27272A' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#12151A',
                    borderColor: '#262B35',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                    fontFamily: "'Barlow Condensed', sans-serif",
                  }}
                  formatter={(val: unknown) => [`${val} ms`, 'HRV RMSSD']}
                />
                <ReferenceLine
                  y={settings.hrvBaseline}
                  stroke="#71717A"
                  strokeDasharray="3 3"
                  label={{ value: `BASELINE ${settings.hrvBaseline}ms`, fill: '#A1A1AA', fontSize: 9, position: 'right' }}
                />
                <Line
                  type="monotone"
                  dataKey="hrv"
                  stroke="#16EC06"
                  strokeWidth={2.5}
                  dot={{ fill: '#16EC06', r: 3.5 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Physiological Key Markers Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        {/* HRV RMSSD Card */}
        <div className="p-3.5 rounded-2xl bg-[#101318] border border-[#1E232D] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 font-condensed flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-zinc-400" />
              HRV (RMSSD)
            </span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase">Current</span>
          </div>

          <div className="text-2xl font-black font-condensed text-white tabular-nums">
            {metrics.currentHrv} <span className="text-xs font-normal text-zinc-500 font-sans">ms</span>
          </div>

          <div className="text-[10px] text-zinc-400 font-condensed">
            Baseline: <b className="text-zinc-200">{settings.hrvBaseline} ms</b>
          </div>

          <div className="pt-1.5 border-t border-[#1E232D]">
            <span className="text-[10px] font-bold font-condensed" style={{ color: recoveryColor }}>
              {metrics.currentHrv >= settings.hrvBaseline ? 'Within / Above Range' : 'Below Baseline'}
            </span>
          </div>
        </div>

        {/* Resting Heart Rate Card */}
        <div className="p-3.5 rounded-2xl bg-[#101318] border border-[#1E232D] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 font-condensed flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-zinc-400" />
              Resting HR
            </span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase">Current</span>
          </div>

          <div className="text-2xl font-black font-condensed text-white tabular-nums">
            {metrics.restingHr} <span className="text-xs font-normal text-zinc-500 font-sans">bpm</span>
          </div>

          <div className="text-[10px] text-zinc-400 font-condensed">
            Baseline: <b className="text-zinc-200">{settings.restingHrBaseline} bpm</b>
          </div>

          <div className="pt-1.5 border-t border-[#1E232D]">
            <span className="text-[10px] font-bold font-condensed text-whoop-blue">
              {metrics.restingHr <= settings.restingHrBaseline ? 'Optimal Resting Zone' : 'Elevated'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Autonomic Recovery Guidance */}
      <div className="p-4 rounded-2xl bg-[#101318] border border-[#1E232D] space-y-2 text-xs leading-relaxed">
        <h4 className="text-xs font-black uppercase tracking-wider text-white font-condensed flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-zinc-400" />
          <span>Autonomic Recovery Guidance</span>
        </h4>
        <p className="text-zinc-400 font-sans">
          {category === 'green'
            ? 'Your parasympathetic nervous system is dominating. Your heart rate variability is elevated above your 30-day baseline, indicating optimal readiness for strenuous workouts, competition, or high cognitive load.'
            : category === 'yellow'
            ? 'Your body is maintaining steady equilibrium. You can handle moderate training, but ensure proper hydration and avoid extending into extreme exhaustion.'
            : 'Sympathetic tone is elevated and autonomic recovery is suppressed. Prioritize restorative sleep, mobility work, and proper electrolyte intake today.'}
        </p>
      </div>
    </div>
  );
};
