import React, { useState } from 'react';
import type { LiveMetrics, HrZoneInfo, UserSettings } from '../../types/whoop';
import {
  Flame,
  Dumbbell,
  Play,
  Square,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface StrainViewProps {
  metrics: LiveMetrics;
  zones: HrZoneInfo[];
  settings: UserSettings;
  onStartWorkout: (sport: string) => void;
  onStopWorkout: () => void;
  isWorkoutActive: boolean;
  workoutElapsedSec: number;
}

export const StrainView: React.FC<StrainViewProps> = ({
  metrics,
  zones,
  settings,
  onStartWorkout,
  onStopWorkout,
  isWorkoutActive,
  workoutElapsedSec,
}) => {
  const [selectedSport, setSelectedSport] = useState('Running');

  const sports = [
    'Running',
    'Weightlifting',
    'Cycling',
    'Functional Fitness',
    'HIIT',
    'Walking',
  ];

  // SVG parameters for large Day Strain ring
  const size = 180;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const strainRatio = Math.min(1, Math.max(0, metrics.dailyStrain / 21.0));
  const strainOffset = circ - strainRatio * circ;

  // Optimal Strain Target bracket arc
  const targetMinRatio = metrics.optimalStrainTarget.min / 21.0;
  const targetMaxRatio = metrics.optimalStrainTarget.max / 21.0;
  const targetArcLength = (targetMaxRatio - targetMinRatio) * circ;
  const targetArcOffset = circ - targetMinRatio * circ;

  const totalZoneSeconds = Object.values(metrics.zoneSeconds).reduce((a, b) => a + b, 0);

  const formatSec = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 7-day strain trend data
  const trendData = [
    { day: 'FRI', date: 'Oct 10', strain: 9.8 },
    { day: 'SAT', date: 'Oct 11', strain: 12.3 },
    { day: 'SUN', date: 'Oct 12', strain: 5.1 },
    { day: 'MON', date: 'Oct 13', strain: 16.2 },
    { day: 'TUE', date: 'Oct 14', strain: 8.4 },
    { day: 'WED', date: 'Oct 15', strain: 14.6 },
    { day: 'TODAY', date: 'Oct 16', strain: Number(metrics.dailyStrain.toFixed(1)) },
  ];

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      {/* 1. Large Day Strain Gauge with Target Bracket */}
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
            {/* Optimal Target Bracket Arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.22)"
              strokeWidth={stroke + 2}
              fill="transparent"
              strokeDasharray={`${targetArcLength} ${circ - targetArcLength}`}
              strokeDashoffset={targetArcOffset}
              strokeLinecap="round"
            />
            {/* Strain Blue Progress Arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#strainGradLarge)"
              strokeWidth={stroke}
              fill="transparent"
              strokeDasharray={circ}
              strokeDashoffset={strainOffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
            <defs>
              <linearGradient id="strainGradLarge" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0093E9" />
                <stop offset="100%" stopColor="#00B4D8" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black font-condensed text-white tracking-tight tabular-nums">
              {metrics.dailyStrain.toFixed(1)}
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#00B4D8] font-condensed mt-0.5">
              Day Strain
            </span>
            <span className="text-[10px] font-bold text-zinc-400 font-condensed">
              Target: {metrics.optimalStrainTarget.min} – {metrics.optimalStrainTarget.max}
            </span>
          </div>
        </div>

        {/* Coach Summary */}
        <div className="mt-4 pt-3 border-t border-[#1E232D] w-full text-xs text-zinc-400 font-sans leading-relaxed">
          Based on your <b className="text-whoop-green">{metrics.recoveryScore}% Recovery</b>, you are primed to absorb up to{' '}
          <b className="text-[#00B4D8]">{metrics.optimalStrainTarget.max} Strain</b> today without accumulating systemic overtraining fatigue.
        </div>
      </div>

      {/* 2. Interactive Recharts 7-Day Strain Trend */}
      <div className="p-4 rounded-2xl bg-[#101318] border border-[#1E232D] space-y-3">
        <div className="flex items-center justify-between border-b border-[#1E232D] pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              7-Day Strain Trend
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase">0.0 – 21.0 Scale</span>
        </div>

        <div className="h-44 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
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
                domain={[0, 21]}
                stroke="#52525B"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#27272A' }}
                ticks={[7, 14, 21]}
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
                formatter={(val: unknown) => [`${val}`, 'Day Strain']}
              />
              <ReferenceLine
                y={metrics.optimalStrainTarget.max}
                stroke="#00B4D8"
                strokeDasharray="3 3"
                label={{ value: `TARGET ${metrics.optimalStrainTarget.max}`, fill: '#00B4D8', fontSize: 9, position: 'right' }}
              />
              <Bar dataKey="strain" fill="#0093E9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Live Workout Coach / Tracker */}
      <div className="p-4 rounded-2xl bg-[#101318] border border-[#1E232D] space-y-3">
        <div className="flex items-center justify-between border-b border-[#1E232D] pb-2">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              Live Strain Coach & Activity Tracker
            </h3>
          </div>
          {isWorkoutActive && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-whoop-blue font-condensed uppercase">
              <span className="w-2 h-2 rounded-full bg-whoop-blue animate-ping" />
              RECORDING LIVE
            </span>
          )}
        </div>

        {!isWorkoutActive ? (
          <div className="space-y-3">
            {/* Sport selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-condensed mb-1.5">
                Select Activity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {sports.map((sport) => (
                  <button
                    key={sport}
                    onClick={() => setSelectedSport(sport)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold font-condensed truncate transition-all ${
                      selectedSport === sport
                        ? 'bg-white text-black shadow-md'
                        : 'bg-[#12151A] text-zinc-400 border border-[#262B35] hover:text-white'
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => onStartWorkout(selectedSport)}
              className="w-full py-3 rounded-xl bg-[#12151A] hover:bg-[#181C23] border border-[#2A303C] text-white font-black text-xs uppercase tracking-wider font-condensed flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start {selectedSport} Session</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Live Stats Strip */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-[#12151A] border border-[#262B35]">
                <div className="text-[10px] font-bold uppercase text-zinc-400 font-condensed">Timer</div>
                <div className="text-xl font-black font-mono text-white mt-0.5">
                  {formatSec(workoutElapsedSec)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#12151A] border border-[#262B35]">
                <div className="text-[10px] font-bold uppercase text-zinc-400 font-condensed">Heart Rate</div>
                <div className="text-xl font-black font-mono text-whoop-blue mt-0.5">
                  {metrics.currentHr} <span className="text-[10px] text-zinc-500">BPM</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#12151A] border border-[#262B35]">
                <div className="text-[10px] font-bold uppercase text-zinc-400 font-condensed">Active Cals</div>
                <div className="text-xl font-black font-mono text-white mt-0.5">
                  {metrics.activeCalories} <span className="text-[10px] text-zinc-500">kcal</span>
                </div>
              </div>
            </div>

            <button
              onClick={onStopWorkout}
              className="w-full py-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-whoop-red font-black text-xs uppercase tracking-wider font-condensed flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Stop & Save Activity</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Real-Time Rest + Zones 1 to 5 Distribution */}
      <div className="p-4 rounded-2xl bg-[#101318] border border-[#1E232D] space-y-3">
        <div className="flex items-center justify-between border-b border-[#1E232D] pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
            Heart Rate Intensity Zones
          </h3>
          <span className="text-[10px] font-mono text-zinc-500">
            MAX HR: {settings.maxHr} BPM
          </span>
        </div>

        <div className="space-y-2.5">
          {zones.map((zone) => {
            const zSec = metrics.zoneSeconds[zone.zone] || 0;
            const pct = totalZoneSeconds > 0 ? Math.round((zSec / totalZoneSeconds) * 100) : 0;
            const isCurrent = metrics.currentZone === zone.zone;

            return (
              <div key={zone.zone} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-condensed">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zone.color }} />
                    {zone.name}
                    {isCurrent && (
                      <span className="text-[9px] uppercase font-black bg-zinc-800 px-1.5 py-0.2 rounded text-whoop-blue">
                        Active
                      </span>
                    )}
                  </span>
                  <div className="font-mono text-xs flex items-center gap-2">
                    <span className="text-white font-bold">{formatSec(zSec)}</span>
                    <span className="text-zinc-500 text-[10px] w-7 text-right">{pct}%</span>
                  </div>
                </div>

                <div className="h-1.5 w-full bg-[#181C23] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(pct, zSec > 0 ? 3 : 0)}%`,
                      backgroundColor: zone.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
