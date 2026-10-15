import React, { useState } from 'react';
import type { LiveMetrics, HrZoneInfo, UserSettings } from '../../types/whoop';
import {
  Flame,
  Clock,
  Heart,
  Dumbbell,
  Play,
  Square,
  Award,
  Zap,
} from 'lucide-react';

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
  const stroke = 13;
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

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300">
      {/* 1. Large Day Strain Gauge with Target Bracket */}
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
            {/* Optimal Target Bracket Arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.28)"
              strokeWidth={stroke + 3}
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
            <span className="text-4xl font-black font-condensed text-white tracking-tight tabular-nums">
              {metrics.dailyStrain.toFixed(1)}
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#00B4D8] font-condensed mt-0.5">
              Day Strain
            </span>
            <span className="text-[10px] font-bold text-whoop-gray font-condensed">
              Target: {metrics.optimalStrainTarget.min} – {metrics.optimalStrainTarget.max}
            </span>
          </div>
        </div>

        {/* Coach Summary */}
        <div className="mt-4 pt-3 border-t border-whoop-border/60 w-full text-xs text-whoop-gray leading-relaxed">
          Based on your <b className="text-whoop-green">{metrics.recoveryScore}% Recovery</b>, you are primed to absorb up to{' '}
          <b className="text-[#00B4D8]">{metrics.optimalStrainTarget.max} Strain</b> today without accumulating unnecessary fatigue.
        </div>
      </div>

      {/* 2. Live Workout Coach / Tracker */}
      <div className="p-4 rounded-2xl bg-whoop-card border border-whoop-border space-y-3">
        <div className="flex items-center justify-between border-b border-whoop-border/60 pb-2">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-whoop-blue" />
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
              <label className="block text-[11px] font-bold uppercase tracking-wider text-whoop-muted font-condensed mb-1.5">
                Select Activity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {sports.map((sport) => (
                  <button
                    key={sport}
                    onClick={() => setSelectedSport(sport)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold font-condensed truncate transition-all ${
                      selectedSport === sport
                        ? 'bg-whoop-blue text-black shadow-md shadow-cyan-500/20'
                        : 'bg-whoop-surface text-whoop-gray border border-whoop-border hover:text-white'
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => onStartWorkout(selectedSport)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-whoop-blue to-[#00B4D8] hover:from-[#0093E9] hover:to-cyan-400 text-black font-black text-xs uppercase tracking-wider font-condensed shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Start {selectedSport} Session</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Live Stats Strip */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-whoop-surface border border-whoop-border">
                <div className="text-[10px] font-bold uppercase text-whoop-muted font-condensed">Timer</div>
                <div className="text-xl font-black font-mono text-white mt-0.5">
                  {formatSec(workoutElapsedSec)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-whoop-surface border border-whoop-border">
                <div className="text-[10px] font-bold uppercase text-whoop-muted font-condensed">Heart Rate</div>
                <div className="text-xl font-black font-mono text-whoop-blue mt-0.5">
                  {metrics.currentHr} <span className="text-[10px] text-whoop-muted">BPM</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-whoop-surface border border-whoop-border">
                <div className="text-[10px] font-bold uppercase text-whoop-muted font-condensed">Active Cals</div>
                <div className="text-xl font-black font-mono text-white mt-0.5">
                  {metrics.activeCalories} <span className="text-[10px] text-whoop-muted">kcal</span>
                </div>
              </div>
            </div>

            <button
              onClick={onStopWorkout}
              className="w-full py-3 rounded-xl bg-whoop-red hover:bg-red-600 text-white font-black text-xs uppercase tracking-wider font-condensed shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop & Save Activity</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Real-Time Rest + Zones 1 to 5 Distribution */}
      <div className="p-4 rounded-2xl bg-whoop-card border border-whoop-border space-y-3">
        <div className="flex items-center justify-between border-b border-whoop-border/60 pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
            Heart Rate Intensity Zones
          </h3>
          <span className="text-[10px] font-mono text-whoop-muted">
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
                      <span className="text-[9px] uppercase font-black bg-whoop-surface px-1.5 py-0.2 rounded text-whoop-blue">
                        Active
                      </span>
                    )}
                  </span>
                  <div className="font-mono text-xs flex items-center gap-2">
                    <span className="text-white font-bold">{formatSec(zSec)}</span>
                    <span className="text-whoop-muted text-[10px] w-7 text-right">{pct}%</span>
                  </div>
                </div>

                <div className="h-1.5 w-full bg-whoop-surface rounded-full overflow-hidden">
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
