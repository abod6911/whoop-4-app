import React from 'react';
import type { LiveMetrics, UserSettings } from '../../types/whoop';
import {
  Activity,
  Heart,
  Moon,
  Timer,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface RecoveryViewProps {
  metrics: LiveMetrics;
  settings: UserSettings;
  onOpenRecoveryTest: () => void;
}

export const RecoveryView: React.FC<RecoveryViewProps> = ({
  metrics,
  settings,
  onOpenRecoveryTest,
}) => {
  const recoveryColor =
    metrics.recoveryCategory === 'green'
      ? '#16EC06'
      : metrics.recoveryCategory === 'yellow'
      ? '#FFDE00'
      : '#FF0026';

  const recoveryGlow =
    metrics.recoveryCategory === 'green'
      ? 'shadow-[0_0_35px_rgba(22,236,6,0.25)]'
      : metrics.recoveryCategory === 'yellow'
      ? 'shadow-[0_0_35px_rgba(255,222,0,0.25)]'
      : 'shadow-[0_0_35px_rgba(255,0,38,0.25)]';

  // SVG parameters for large Recovery ring
  const size = 180;
  const stroke = 13;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (metrics.recoveryScore / 100) * circ;

  // Mock 7-day trend data for HRV and RHR
  const hrv7Days = [64, 62, 71, 68, 65, 72, metrics.currentHrv];
  const rhr7Days = [54, 53, 51, 52, 53, 50, metrics.restingHr];
  const daysOfWeek = ['F', 'S', 'S', 'M', 'T', 'W', 'T'];

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300">
      {/* 1. Large Circular Recovery Gauge */}
      <div className={`p-6 rounded-2xl bg-whoop-card border border-whoop-border flex flex-col items-center justify-center text-center transition-all ${recoveryGlow}`}>
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
            <span className="text-xs font-black uppercase tracking-widest text-white font-condensed mt-1">
              {metrics.recoveryCategory.toUpperCase()} RECOVERY
            </span>
          </div>
        </div>

        {/* Action Button: Morning Recovery Assessment */}
        <button
          onClick={onOpenRecoveryTest}
          className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black text-xs uppercase tracking-wider font-condensed shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Timer className="w-4 h-4" />
          <span>Measure Morning Recovery (3-Min HRV Test)</span>
        </button>
      </div>

      {/* 2. Autonomic Nervous System Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        {/* HRV RMSSD Card with 7-Day Trend Bar Chart */}
        <div className="p-3.5 rounded-2xl bg-whoop-card border border-whoop-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-whoop-gray font-condensed flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-whoop-green" />
              HRV
            </span>
            <span className="text-[10px] font-mono text-whoop-muted">7-DAY</span>
          </div>

          <div className="text-2xl font-black font-condensed text-white tabular-nums">
            {metrics.currentHrv} <span className="text-xs font-normal text-whoop-muted font-sans">ms</span>
          </div>

          <div className="text-[10px] text-whoop-green font-condensed font-bold">
            Baseline: {settings.hrvBaseline} ms
          </div>

          {/* Mini 7-day bars */}
          <div className="flex items-end justify-between gap-1 h-12 pt-2 border-t border-whoop-border/50">
            {hrv7Days.map((val, idx) => {
              const hPct = Math.min(100, Math.max(20, (val / 90) * 100));
              const isToday = idx === 6;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-whoop-surface rounded-t flex items-end h-8">
                    <div
                      className={`w-full rounded-t transition-all ${
                        isToday ? 'bg-whoop-green' : 'bg-slate-700'
                      }`}
                      style={{ height: `${hPct}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-whoop-muted">{daysOfWeek[idx]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resting Heart Rate Card with 7-Day Trend Bar Chart */}
        <div className="p-3.5 rounded-2xl bg-whoop-card border border-whoop-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-whoop-gray font-condensed flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-whoop-red" />
              Resting HR
            </span>
            <span className="text-[10px] font-mono text-whoop-muted">7-DAY</span>
          </div>

          <div className="text-2xl font-black font-condensed text-white tabular-nums">
            {metrics.restingHr} <span className="text-xs font-normal text-whoop-muted font-sans">bpm</span>
          </div>

          <div className="text-[10px] text-whoop-blue font-condensed font-bold">
            Baseline: {settings.restingHrBaseline} bpm
          </div>

          {/* Mini 7-day bars */}
          <div className="flex items-end justify-between gap-1 h-12 pt-2 border-t border-whoop-border/50">
            {rhr7Days.map((val, idx) => {
              const hPct = Math.min(100, Math.max(20, (val / 80) * 100));
              const isToday = idx === 6;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-whoop-surface rounded-t flex items-end h-8">
                    <div
                      className={`w-full rounded-t transition-all ${
                        isToday ? 'bg-whoop-blue' : 'bg-slate-700'
                      }`}
                      style={{ height: `${hPct}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-whoop-muted">{daysOfWeek[idx]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Physiological Guidance Card */}
      <div className="p-4 rounded-2xl bg-whoop-card border border-whoop-border space-y-2 text-xs leading-relaxed">
        <h4 className="text-xs font-black uppercase tracking-wider text-white font-condensed flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-whoop-green" />
          <span>Autonomic Recovery Guidance</span>
        </h4>
        <p className="text-whoop-gray">
          {metrics.recoveryCategory === 'green'
            ? 'Your parasympathetic nervous system is dominating. Your heart rate variability is elevated above your 30-day baseline, indicating optimal readiness for strenuous workouts, competition, or high cognitive load.'
            : metrics.recoveryCategory === 'yellow'
            ? 'Your body is maintaining steady equilibrium. You can handle moderate training, but ensure proper hydration and avoid extending into extreme exhaustion.'
            : 'Sympathetic tone is elevated and autonomic recovery is suppressed. Prioritize restorative sleep, mobility work, and proper electrolyte intake today.'}
        </p>
      </div>
    </div>
  );
};
