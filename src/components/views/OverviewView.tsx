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
  ChevronRight,
  TrendingUp,
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
    <div className="space-y-4 pb-20 animate-in fade-in duration-300">
      {/* 1. Signature WHOOP Triple Gauge */}
      <WhoopTripleGauge
        metrics={metrics}
        onSelectTab={onSelectSubTab}
        activeSubTab="overview"
      />

      {/* 2. WHOOP Health Monitor Card */}
      <WhoopHealthMonitor metrics={healthMetrics} />

      {/* 3. My Day / Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onStartActivity}
          className="p-3.5 rounded-2xl bg-whoop-card border border-whoop-border hover:border-whoop-blue/60 transition-all text-left flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-whoop-blue/15 text-whoop-blue flex items-center justify-center border border-whoop-blue/30 group-hover:scale-105 transition-transform">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-white font-condensed">
                Start Activity
              </div>
              <div className="text-[10px] text-whoop-muted font-mono">Live Strain Coach</div>
            </div>
          </div>
          <Plus className="w-4 h-4 text-whoop-blue" />
        </button>

        <button
          onClick={onLogSleep}
          className="p-3.5 rounded-2xl bg-whoop-card border border-whoop-border hover:border-[#7395B7]/60 transition-all text-left flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#7395B7]/15 text-[#7395B7] flex items-center justify-center border border-[#7395B7]/30 group-hover:scale-105 transition-transform">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-white font-condensed">
                Log Sleep
              </div>
              <div className="text-[10px] text-whoop-muted font-mono">OLED Night Lock</div>
            </div>
          </div>
          <Plus className="w-4 h-4 text-[#7395B7]" />
        </button>
      </div>

      {/* 4. Today's Key Statistics Range Bars (vs 30-Day Baseline) */}
      <div className="p-4 rounded-2xl bg-whoop-card border border-whoop-border space-y-3">
        <div className="flex items-center justify-between border-b border-whoop-border/60 pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
            Key Statistics
          </h3>
          <span className="text-[10px] font-mono text-whoop-muted">
            VS 30-DAY BASELINE
          </span>
        </div>

        {/* Metric 1: HRV */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-whoop-gray flex items-center gap-1 font-condensed text-xs uppercase font-bold">
              <Activity className="w-3.5 h-3.5 text-whoop-green" />
              HRV (RMSSD)
            </span>
            <span className="text-white font-bold">{metrics.currentHrv} ms</span>
          </div>
          <div className="relative h-2 w-full bg-whoop-surface rounded-full overflow-hidden">
            {/* 30-day baseline typical range band */}
            <div className="absolute top-0 bottom-0 left-[35%] right-[30%] bg-slate-700/60 rounded-full" />
            {/* Today's marker */}
            <div
              className="absolute top-0 bottom-0 w-2.5 rounded-full bg-whoop-green shadow-sm shadow-green-500/50"
              style={{
                left: `${Math.min(95, Math.max(5, (metrics.currentHrv / 120) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Metric 2: RHR */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-whoop-gray flex items-center gap-1 font-condensed text-xs uppercase font-bold">
              <Heart className="w-3.5 h-3.5 text-whoop-red" />
              Resting Heart Rate
            </span>
            <span className="text-white font-bold">{metrics.restingHr} bpm</span>
          </div>
          <div className="relative h-2 w-full bg-whoop-surface rounded-full overflow-hidden">
            <div className="absolute top-0 bottom-0 left-[25%] right-[45%] bg-slate-700/60 rounded-full" />
            <div
              className="absolute top-0 bottom-0 w-2.5 rounded-full bg-whoop-blue shadow-sm shadow-blue-500/50"
              style={{
                left: `${Math.min(95, Math.max(5, (metrics.restingHr / 100) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Metric 3: Active Calories */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-whoop-gray flex items-center gap-1 font-condensed text-xs uppercase font-bold">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              Active Calories
            </span>
            <span className="text-white font-bold">{metrics.activeCalories} kcal</span>
          </div>
          <div className="relative h-2 w-full bg-whoop-surface rounded-full overflow-hidden">
            <div className="absolute top-0 bottom-0 left-[20%] right-[35%] bg-slate-700/60 rounded-full" />
            <div
              className="absolute top-0 bottom-0 w-2.5 rounded-full bg-orange-400 shadow-sm shadow-orange-500/50"
              style={{
                left: `${Math.min(95, Math.max(5, (metrics.activeCalories / 800) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 5. Activities List */}
      <div className="p-4 rounded-2xl bg-whoop-card border border-whoop-border space-y-3">
        <div className="flex items-center justify-between border-b border-whoop-border/60 pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
            Activities Logged Today
          </h3>
          <span className="text-[10px] font-mono text-whoop-muted">
            {sessions.length} RECORDED
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="py-6 text-center text-xs text-whoop-muted font-condensed space-y-1">
            <p className="font-bold text-whoop-gray">No activities recorded today yet.</p>
            <p className="text-[11px] text-slate-500">Tap "+ Start Activity" above to track workout strain.</p>
          </div>
        ) : (
          <div className="divide-y divide-whoop-border/40">
            {sessions.slice(0, 3).map((s) => (
              <div key={s.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${
                    s.type === 'workout' ? 'bg-whoop-blue/20 text-whoop-blue' : 'bg-[#7395B7]/20 text-[#7395B7]'
                  }`}>
                    {s.type === 'workout' ? <Dumbbell className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white font-sans">{s.title}</div>
                    <div className="text-[10px] text-whoop-muted font-mono">
                      {Math.floor(s.durationSec / 60)}m • Avg {s.avgHr} bpm
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black font-condensed text-whoop-blue tabular-nums">
                    {s.strain.toFixed(1)}
                  </div>
                  <div className="text-[9px] uppercase font-bold text-whoop-muted font-condensed">
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
