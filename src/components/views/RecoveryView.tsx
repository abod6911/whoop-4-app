import React, { useState } from 'react';
import type { LiveMetrics, UserSettings } from '../../types/whoop';
import { storageService } from '../../services/StorageService';
import {
  Activity,
  Heart,
  ShieldCheck,
  Timer,
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

export const getRecoveryColor = (score: number | null) => {
  if (score === null) return '#52525B';
  if (score >= 67) return '#16EC06';
  if (score >= 34) return '#FFDE00';
  return '#FF0026';
};

export const getRecoveryCategory = (score: number | null): 'green' | 'yellow' | 'red' | 'calibrating' => {
  if (score === null) return 'calibrating';
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
  const offset = metrics.recoveryScore !== null ? circ - (metrics.recoveryScore / 100) * circ : circ;

  // Real 7-day history from storage
  const daysHistory = storageService.getDaysHistory();
  const trendData = daysHistory.map((d) => ({
    day: d.label === 'TODAY' ? 'TODAY' : d.label.slice(0, 3),
    date: d.date,
    recovery: d.label === 'TODAY' ? metrics.recoveryScore : d.recoveryScore,
    hrv: d.label === 'TODAY' ? metrics.currentHrv : d.hrv,
    rhr: d.label === 'TODAY' ? metrics.restingHr : d.rhr,
  })).reverse();

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* 1. Large Circular Recovery Gauge */}
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
            {metrics.recoveryScore !== null && (
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
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-5xl font-black font-condensed tracking-tight tabular-nums"
              style={{ color: recoveryColor }}
            >
              {metrics.recoveryScore !== null ? `${metrics.recoveryScore}%` : '--'}
            </span>
            <span
              className="text-xs font-black uppercase tracking-widest font-condensed mt-1"
              style={{ color: recoveryColor }}
            >
              {category.toUpperCase()} RECOVERY
            </span>
          </div>
        </div>

        {/* Guidance text */}
        <div className="mt-4 text-xs text-zinc-400 font-sans max-w-[320px] leading-relaxed">
          {category === 'green'
            ? 'Your body is primed to take on high strain. Optimal autonomic balance and elevated HRV.'
            : category === 'yellow'
            ? 'Your autonomic nervous system is in steady balance. Moderate strain is recommended.'
            : category === 'red'
            ? 'Your body is fatigued and recovering. Prioritize rest, hydration, and restorative sleep.'
            : 'Strap is calibrating your daily recovery from continuous HRV and resting heart rate data.'}
        </div>

        {/* Action Button: Morning Recovery Assessment */}
        <button
          onClick={onOpenRecoveryTest}
          className="mt-5 w-full py-3 px-4 rounded-xl bg-[#0B0D10] hover:bg-[#12151A] border border-white/10 transition-all flex items-center justify-center gap-2 active:scale-98"
        >
          <Timer className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-black uppercase tracking-wider text-white font-condensed">
            Measure Morning Recovery (3-Min HRV Test)
          </span>
        </button>
      </div>

      {/* 2. Interactive Recharts 7-Day Trend Card */}
      <div className="p-4 rounded-[20px] bg-[#16191E] border border-white/5 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              7-Day Recovery Trends
            </h3>
          </div>

          <div className="flex items-center bg-[#0B0D10] p-0.5 rounded-lg border border-white/5">
            <button
              onClick={() => setActiveChartTab('recovery')}
              className={`px-2 py-0.5 text-[10px] font-black uppercase font-condensed rounded ${
                activeChartTab === 'recovery' ? 'bg-[#222730] text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              Recovery %
            </button>
            <button
              onClick={() => setActiveChartTab('hrv')}
              className={`px-2 py-0.5 text-[10px] font-black uppercase font-condensed rounded ${
                activeChartTab === 'hrv' ? 'bg-[#222730] text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              HRV ms
            </button>
          </div>
        </div>

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
                    backgroundColor: '#101318',
                    borderColor: '#262B35',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                  formatter={(val: unknown) => [val !== null ? `${val}%` : '--', 'Recovery']}
                />
                <ReferenceLine y={67} stroke="#16EC06" strokeDasharray="3 3" />
                <ReferenceLine y={34} stroke="#FFDE00" strokeDasharray="3 3" />
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
                    backgroundColor: '#101318',
                    borderColor: '#262B35',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                  formatter={(val: unknown) => [val !== null ? `${val} ms` : '--', 'HRV RMSSD']}
                />
                <ReferenceLine y={settings.hrvBaseline} stroke="#71717A" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="hrv"
                  stroke="#16EC06"
                  strokeWidth={2.5}
                  dot={{ fill: '#16EC06', r: 3.5 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Physiological Markers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-[20px] bg-[#16191E] border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 font-condensed flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-zinc-400" />
              HRV (RMSSD)
            </span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase">Current</span>
          </div>

          <div className="text-2xl font-black font-condensed text-white tabular-nums">
            {metrics.currentHrv !== null ? metrics.currentHrv : '--'}{' '}
            <span className="text-xs font-normal text-zinc-500 font-sans">ms</span>
          </div>

          <div className="text-[10px] text-zinc-400 font-condensed">
            Baseline: <b className="text-zinc-200">{settings.hrvBaseline} ms</b>
          </div>
        </div>

        <div className="p-3.5 rounded-[20px] bg-[#16191E] border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 font-condensed flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-zinc-400" />
              Resting HR
            </span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase">Current</span>
          </div>

          <div className="text-2xl font-black font-condensed text-white tabular-nums">
            {metrics.restingHr !== null ? metrics.restingHr : '--'}{' '}
            <span className="text-xs font-normal text-zinc-500 font-sans">bpm</span>
          </div>

          <div className="text-[10px] text-zinc-400 font-condensed">
            Baseline: <b className="text-zinc-200">{settings.restingHrBaseline} bpm</b>
          </div>
        </div>
      </div>
    </div>
  );
};
