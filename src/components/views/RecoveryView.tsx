import React from 'react';
import type { LiveMetrics, UserSettings } from '../../types/whoop';
import { storageService } from '../../services/StorageService';
import {
  Activity,
  Heart,
  Share2,
  Wind,
  Moon,
  Info,
  Timer,
  CheckCircle2,
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

export const RecoveryView: React.FC<RecoveryViewProps> = ({
  metrics,
  settings,
  onOpenRecoveryTest,
}) => {
  const recoveryScore = metrics.recoveryScore ?? 88;
  const recoveryColor = getRecoveryColor(recoveryScore);

  const size = 180;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (recoveryScore / 100) * circ;

  // 7-day data
  const recovery7Day = [
    { day: 'Sat', score: 78 },
    { day: 'Sun', score: 85 },
    { day: 'Mon', score: 62 },
    { day: 'Tue', score: 71 },
    { day: 'Wed', score: 82 },
    { day: 'Thu', score: 91 },
    { day: 'Fri', score: recoveryScore },
  ];

  const hrv7Day = [
    { day: 'Sat', hrv: 62 },
    { day: 'Sun', hrv: 68 },
    { day: 'Mon', hrv: 54 },
    { day: 'Tue', hrv: 59 },
    { day: 'Wed', hrv: 66 },
    { day: 'Thu', hrv: 72 },
    { day: 'Fri', hrv: metrics.currentHrv ?? 64 },
  ];

  const rhr7Day = [
    { day: 'Sat', rhr: 54 },
    { day: 'Sun', rhr: 52 },
    { day: 'Mon', rhr: 57 },
    { day: 'Tue', rhr: 55 },
    { day: 'Wed', rhr: 53 },
    { day: 'Thu', rhr: 50 },
    { day: 'Fri', rhr: metrics.restingHr ?? settings.restingHrBaseline },
  ];

  const resp7Day = [
    { day: 'Sat', resp: 14.1 },
    { day: 'Sun', resp: 13.9 },
    { day: 'Mon', resp: 14.6 },
    { day: 'Tue', resp: 14.3 },
    { day: 'Wed', resp: 14.0 },
    { day: 'Thu', resp: 13.8 },
    { day: 'Fri', resp: metrics.respiratoryRate ?? 14.2 },
  ];

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* 1. Large Circular Recovery Gauge + Share (01:35 in Video) */}
      <div className="p-6 rounded-[24px] bg-[#12151A] border border-white/5 flex flex-col items-center justify-center text-center">
        <div className="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider font-condensed text-zinc-400 mb-2">
          <span>RECOVERY SCORE</span>
          <button className="flex items-center gap-1 text-[#00F0FF] hover:underline">
            <Share2 className="w-3.5 h-3.5" />
            <span>SHARE</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#1E2522"
              strokeWidth={stroke}
              fill="transparent"
            />
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
              className="text-6xl font-black font-condensed tracking-tight tabular-nums transition-colors"
              style={{ color: recoveryColor }}
            >
              {recoveryScore}%
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 font-condensed mt-1">
              {recoveryScore >= 67 ? 'GREEN' : recoveryScore >= 34 ? 'YELLOW' : 'RED'}
            </span>
          </div>
        </div>

        {/* Dynamic Insight Box */}
        <div className="mt-5 w-full p-3.5 rounded-2xl bg-[#0D1612] border border-[#16EC06]/20 text-xs text-zinc-300 leading-relaxed text-left flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#16EC06] flex-shrink-0 mt-0.5" />
          <p>
            Your autonomic nervous system is in balance. Resting heart rate of {metrics.restingHr ?? settings.restingHrBaseline} bpm and elevated HRV indicate adequate physiological restoration.
          </p>
        </div>

        {/* 3-Min HRV Test Launcher */}
        <button
          onClick={onOpenRecoveryTest}
          className="mt-3 w-full py-3 px-4 rounded-xl bg-[#0B0D10] hover:bg-[#16191E] border border-white/10 text-white font-black text-xs uppercase tracking-wider font-condensed flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <Timer className="w-4 h-4 text-[#16EC06]" />
          <span>Measure Morning Recovery (3-Min HRV Test)</span>
        </button>
      </div>

      {/* 2. RECOVERY STATISTICS Rows */}
      <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed px-1">
          Recovery Statistics
        </h3>

        <div className="divide-y divide-white/5">
          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <div className="flex items-center gap-2 text-zinc-400">
              <Activity className="w-3.5 h-3.5 text-zinc-300" />
              <span className="uppercase">HEART RATE VARIABILITY</span>
            </div>
            <span className="text-white font-mono font-bold">
              {metrics.currentHrv ?? settings.hrvBaseline} ms
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <div className="flex items-center gap-2 text-zinc-400">
              <Heart className="w-3.5 h-3.5 text-zinc-300" />
              <span className="uppercase">RESTING HEART RATE</span>
            </div>
            <span className="text-white font-mono font-bold">
              {metrics.restingHr ?? settings.restingHrBaseline} bpm
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <div className="flex items-center gap-2 text-zinc-400">
              <Wind className="w-3.5 h-3.5 text-zinc-300" />
              <span className="uppercase">RESPIRATORY RATE</span>
            </div>
            <span className="text-white font-mono font-bold">
              {metrics.respiratoryRate ?? 14.2} rpm
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between text-xs font-condensed font-bold">
            <div className="flex items-center gap-2 text-zinc-400">
              <Moon className="w-3.5 h-3.5 text-zinc-300" />
              <span className="uppercase">SLEEP PERFORMANCE</span>
            </div>
            <span className="text-white font-mono font-bold">
              {metrics.sleepPerformance !== null ? `${metrics.sleepPerformance}%` : '100%'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. 4 Dedicated 7-Day Charts (01:42 – 01:54 in Video) */}
      <div className="space-y-4">
        {/* Chart 1: RECOVERY Vertical Bars */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>RECOVERY (7 DAYS)</span>
            <span className="text-[10px] text-[#16EC06] font-mono">AVG: 79%</span>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recovery7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {recovery7Day.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getRecoveryColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: HEART RATE VARIABILITY Line Chart */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>HEART RATE VARIABILITY (HRV RMSSD)</span>
            <span className="text-[10px] text-[#16EC06] font-mono">30D BASELINE: {settings.hrvBaseline} ms</span>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hrv7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[40, 90]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Line type="monotone" dataKey="hrv" stroke="#16EC06" strokeWidth={2.5} dot={{ r: 3, fill: '#16EC06' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: RESTING HEART RATE Line Chart */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>RESTING HEART RATE</span>
            <span className="text-[10px] text-zinc-400 font-mono">TYPICAL: {settings.restingHrBaseline} bpm</span>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rhr7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[45, 65]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Line type="monotone" dataKey="rhr" stroke="#FF0026" strokeWidth={2.5} dot={{ r: 3, fill: '#FF0026' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: RESPIRATORY RATE Line Chart */}
        <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase font-condensed text-white">
            <span>RESPIRATORY RATE (RPM)</span>
            <span className="text-[10px] text-[#7293B2] font-mono">AVG: 14.1 rpm</span>
          </div>
          <div className="h-32 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={resp7Day} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[12, 17]} stroke="#52525B" tick={{ fontSize: 9 }} tickLine={false} />
                <Line type="monotone" dataKey="resp" stroke="#7293B2" strokeWidth={2.5} dot={{ r: 3, fill: '#7293B2' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
