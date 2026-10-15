import React from 'react';
import type { LiveMetrics, HomeSubTab, HealthMonitorMetric, SessionRecord, UserSettings } from '../../types/whoop';
import { WhoopTripleGauge } from '../WhoopTripleGauge';
import { WhoopHealthMonitor } from '../WhoopHealthMonitor';
import {
  Flame,
  Heart,
  Activity,
  Plus,
  Dumbbell,
  Moon,
} from 'lucide-react';

interface OverviewViewProps {
  metrics: LiveMetrics;
  healthMetrics: HealthMonitorMetric[];
  sessions: SessionRecord[];
  settings: UserSettings;
  onSelectSubTab: (tab: HomeSubTab) => void;
  onStartActivity: () => void;
  onLogSleep: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  metrics,
  healthMetrics,
  sessions,
  settings,
  onSelectSubTab,
  onStartActivity,
  onLogSleep,
}) => {
  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      {/* 1. Signature WHOOP Triple Gauge Header */}
      <WhoopTripleGauge
        metrics={metrics}
        onSelectTab={onSelectSubTab}
        activeSubTab="overview"
      />

      {/* 2. Official Compact WHOOP Health Monitor */}
      <WhoopHealthMonitor metrics={healthMetrics} />

      {/* 3. My Day Quick Action Buttons (Clean Black Capsule Style) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onStartActivity}
          className="py-3 px-4 rounded-xl bg-[#12151A] hover:bg-[#181C23] border border-[#2A303C] transition-all flex items-center justify-center gap-2 active:scale-98"
        >
          <Plus className="w-4 h-4 text-white" />
          <span className="text-xs font-black uppercase tracking-wider text-white font-condensed">
            Start Activity
          </span>
        </button>

        <button
          onClick={onLogSleep}
          className="py-3 px-4 rounded-xl bg-[#12151A] hover:bg-[#181C23] border border-[#2A303C] transition-all flex items-center justify-center gap-2 active:scale-98"
        >
          <Moon className="w-4 h-4 text-zinc-300" />
          <span className="text-xs font-black uppercase tracking-wider text-white font-condensed">
            Log Sleep
          </span>
        </button>
      </div>

      {/* 4. Key Statistics Range Bars (vs 30-Day Baseline) */}
      <div className="p-4 rounded-2xl bg-[#101318] border border-[#1E232D] space-y-3.5">
        <div className="flex items-center justify-between border-b border-[#1E232D] pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
            Key Statistics
          </h3>
          <span className="text-[10px] font-mono text-zinc-500 uppercase">
            30-Day Baseline
          </span>
        </div>

        {/* Metric 1: HRV */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-zinc-400 font-condensed text-xs uppercase font-bold tracking-wide">
              HRV (RMSSD)
            </span>
            <span className="text-white font-bold font-condensed text-sm">{metrics.currentHrv} ms</span>
          </div>
          <div className="relative h-2 w-full bg-[#181C23] rounded-full overflow-hidden">
            <div className="absolute top-0 bottom-0 left-[35%] right-[30%] bg-zinc-700/60 rounded-full" />
            <div
              className="absolute top-0 bottom-0 w-2.5 rounded-full bg-whoop-green shadow-sm shadow-green-500/50"
              style={{
                left: `${Math.min(95, Math.max(5, (metrics.currentHrv / 120) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Metric 2: RHR */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-zinc-400 font-condensed text-xs uppercase font-bold tracking-wide">
              Resting Heart Rate
            </span>
            <span className="text-white font-bold font-condensed text-sm">{metrics.restingHr} bpm</span>
          </div>
          <div className="relative h-2 w-full bg-[#181C23] rounded-full overflow-hidden">
            <div className="absolute top-0 bottom-0 left-[25%] right-[45%] bg-zinc-700/60 rounded-full" />
            <div
              className="absolute top-0 bottom-0 w-2.5 rounded-full bg-whoop-blue shadow-sm shadow-blue-500/50"
              style={{
                left: `${Math.min(95, Math.max(5, (metrics.restingHr / 100) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Metric 3: Active Calories */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-zinc-400 font-condensed text-xs uppercase font-bold tracking-wide">
              Active Calories
            </span>
            <span className="text-white font-bold font-condensed text-sm">{metrics.activeCalories} kcal</span>
          </div>
          <div className="relative h-2 w-full bg-[#181C23] rounded-full overflow-hidden">
            <div className="absolute top-0 bottom-0 left-[20%] right-[35%] bg-zinc-700/60 rounded-full" />
            <div
              className="absolute top-0 bottom-0 w-2.5 rounded-full bg-orange-400 shadow-sm shadow-orange-500/50"
              style={{
                left: `${Math.min(95, Math.max(5, (metrics.activeCalories / 800) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 5. Activities Logged Today */}
      <div className="p-4 rounded-2xl bg-[#101318] border border-[#1E232D] space-y-3">
        <div className="flex items-center justify-between border-b border-[#1E232D] pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
            Activities Logged Today
          </h3>
          <span className="text-[10px] font-mono text-zinc-500">
            {sessions.length} RECORDED
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="py-5 text-center text-xs text-zinc-500 font-condensed">
            No activities recorded today yet.
          </div>
        ) : (
          <div className="divide-y divide-[#1A1F28]/60">
            {sessions.map((s) => (
              <div key={s.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#161B22] border border-[#222834] text-zinc-300">
                    {s.type === 'workout' ? <Dumbbell className="w-4 h-4 text-whoop-blue" /> : <Moon className="w-4 h-4 text-[#7395B7]" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white font-sans">{s.title}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {Math.floor(s.durationSec / 60)} min • Avg {s.avgHr} bpm
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black font-condensed text-whoop-blue tabular-nums">
                    {s.strain.toFixed(1)}
                  </div>
                  <div className="text-[9px] uppercase font-bold text-zinc-500 font-condensed">
                    STRAIN
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
