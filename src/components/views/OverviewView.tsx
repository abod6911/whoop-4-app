import React, { useState } from 'react';
import type { LiveMetrics, HomeSubTab, HealthMonitorMetric, SessionRecord, UserSettings, DeviceMetadata } from '../../types/whoop';
import { WhoopTripleGauge } from '../WhoopTripleGauge';
import { WhoopHealthMonitor } from '../WhoopHealthMonitor';
import { DailyOutlookModal } from '../DailyOutlookModal';
import {
  Heart,
  Activity,
  Flame,
  Wind,
  Timer,
  ChevronRight,
  Maximize2,
  Dumbbell,
  Moon,
  Sparkles,
  Zap,
} from 'lucide-react';

interface OverviewViewProps {
  metrics: LiveMetrics;
  healthMetrics: HealthMonitorMetric[];
  sessions: SessionRecord[];
  settings: UserSettings;
  metadata: DeviceMetadata;
  onSelectSubTab: (tab: HomeSubTab) => void;
  onSwitchToHealthTab: () => void;
  onStartActivity: () => void;
  onLogSleep: () => void;
  onOpenJournal?: () => void;
  onOpenSleepPlanner?: () => void;
  onOpenStrengthTrainer?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  metrics,
  healthMetrics,
  sessions,
  settings,
  metadata,
  onSelectSubTab,
  onSwitchToHealthTab,
  onStartActivity,
  onLogSleep,
  onOpenJournal,
  onOpenSleepPlanner,
  onOpenStrengthTrainer,
}) => {
  const [isHealthMonitorModalOpen, setIsHealthMonitorModalOpen] = useState(false);
  const [isOutlookModalOpen, setIsOutlookModalOpen] = useState(false);

  // Stress formatting
  const stressScore = metrics.stressScore;
  const stressTime = new Date(metrics.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let stressBadgeColor = 'bg-[#16191E] text-zinc-500 border-white/5';
  let stressText = 'Calibrating';
  if (stressScore !== null) {
    if (stressScore < 1.0) {
      stressBadgeColor = 'bg-[#0D3528] text-[#16EC06] border-[#16EC06]/30';
      stressText = 'LOW';
    } else if (stressScore < 2.0) {
      stressBadgeColor = 'bg-[#3A2E14] text-[#FFDE00] border-[#FFDE00]/30';
      stressText = 'MEDIUM';
    } else {
      stressBadgeColor = 'bg-[#351515] text-[#FF8A00] border-[#FF8A00]/30';
      stressText = 'HIGH';
    }
  }

  // Active health metrics count
  const activeHealthCount = healthMetrics.filter((m) => m.value !== null).length;

  return (
    <div className="space-y-5 pb-28 animate-in fade-in duration-300">
      {/* 1. 3 Equal-Sized Horizontal Rings (Sleep | Recovery | Strain) */}
      <div className="rounded-[20px] bg-[#16191E] border border-white/5 py-2">
        <WhoopTripleGauge metrics={metrics} onSelectTab={onSelectSubTab} activeSubTab="overview" />
      </div>

      {/* 2. 2 Side-by-Side Monitor Cards */}
      <div className="grid grid-cols-2 gap-3 px-1">
        {/* Left: HEALTH MONITOR */}
        <button
          onClick={() => setIsHealthMonitorModalOpen(true)}
          className="p-4 rounded-[20px] bg-[#16191E] border border-white/5 hover:border-zinc-700 text-left transition-all active:scale-98 flex flex-col justify-between h-[104px]"
        >
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-white font-condensed">
            <span>HEALTH MONITOR</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          </div>

          <div className="flex items-center gap-2">
            {activeHealthCount > 0 ? (
              <>
                <div className="w-7 h-7 rounded-lg bg-[#0D3528] text-[#16EC06] flex items-center justify-center font-bold text-xs border border-[#16EC06]/30">
                  ✓
                </div>
                <div>
                  <div className="text-xs font-black text-[#16EC06] font-condensed uppercase tracking-wide">
                    WITHIN RANGE
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {activeHealthCount}/5 Metrics
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs text-zinc-500 font-mono">
                Calibrating...
              </div>
            )}
          </div>
        </button>

        {/* Right: STRESS MONITOR */}
        <button
          onClick={onSwitchToHealthTab}
          className="p-4 rounded-[20px] bg-[#16191E] border border-white/5 hover:border-zinc-700 text-left transition-all active:scale-98 flex flex-col justify-between h-[104px]"
        >
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-white font-condensed">
            <span>STRESS MONITOR</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          </div>

          <div className="flex items-center gap-2">
            {stressScore !== null ? (
              <>
                <div
                  className={`px-2 py-1 rounded-lg border font-mono font-black text-sm ${stressBadgeColor}`}
                >
                  {stressScore.toFixed(1)}
                </div>
                <div>
                  <div
                    className={`text-xs font-black font-condensed uppercase tracking-wide ${
                      stressScore < 1.0 ? 'text-[#16EC06]' : stressScore < 2.0 ? 'text-[#FFDE00]' : 'text-[#FF8A00]'
                    }`}
                  >
                    {stressText}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {stressTime}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs text-zinc-500 font-mono">
                {metrics.currentHr ? 'Evaluating...' : 'Connect Strap'}
              </div>
            )}
          </div>
        </button>
      </div>

      {/* 3. "My Day" Section */}
      <div className="space-y-3 px-1">
        <h2 className="text-xl font-bold text-white tracking-tight">My Day</h2>

        {/* Daily Outlook Row */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsOutlookModalOpen(true)}
            className="w-12 h-12 rounded-[18px] bg-[#16191E] border border-white/5 hover:border-zinc-700 flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
            title="WHOOP Daily Outlook"
          >
            <div className="w-7 h-7 rounded-full bg-white text-black font-black font-condensed flex items-center justify-center text-xs">
              W
            </div>
          </button>

          <button
            onClick={() => setIsOutlookModalOpen(true)}
            className="flex-1 p-3.5 rounded-[18px] bg-[#16191E] border border-white/5 hover:border-zinc-700 flex items-center justify-between transition-all active:scale-98 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🌅</span>
              <span className="text-xs font-black uppercase tracking-wider text-white font-condensed">
                Daily Outlook
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {/* Quick Journal & Sleep Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenJournal}
            className="p-3 rounded-[18px] bg-[#16191E] border border-white/5 hover:border-zinc-700 flex items-center justify-between transition-all active:scale-98 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">📖</span>
              <span className="text-xs font-black uppercase tracking-wider text-white font-condensed">
                Daily Journal
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>

          <button
            onClick={onOpenSleepPlanner}
            className="p-3 rounded-[18px] bg-[#16191E] border border-white/5 hover:border-zinc-700 flex items-center justify-between transition-all active:scale-98 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🌙</span>
              <span className="text-xs font-black uppercase tracking-wider text-white font-condensed">
                Sleep Planner
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {/* TODAY'S ACTIVITIES Card */}
        <div className="rounded-[20px] bg-[#16191E] border border-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-300 font-condensed">
              TODAY'S ACTIVITIES
            </span>
            <Maximize2 className="w-3.5 h-3.5 text-zinc-500" />
          </div>

          {sessions.length === 0 ? (
            <div className="py-4 text-center text-xs text-zinc-500 font-sans">
              No activities recorded today yet.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {sessions.map((s) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Left colored pill */}
                    <div
                      className={`px-2.5 py-1 rounded-full font-condensed font-black text-xs flex items-center gap-1 ${
                        s.type === 'workout'
                          ? 'bg-[#0093E9]/20 text-[#0093E9] border border-[#0093E9]/40'
                          : 'bg-[#7293B2]/20 text-[#7293B2] border border-[#7293B2]/40'
                      }`}
                    >
                      <span>{s.type === 'workout' ? '🏋️' : '🌙'}</span>
                      <span>{s.strain.toFixed(1)}</span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-white uppercase font-sans">
                        {s.title}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {Math.floor(s.durationSec / 60)} min • Avg {s.avgHr} bpm
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[10px] font-mono text-zinc-400">
                    <div>{new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div>{new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. "My Dashboard" Live Metric Rows */}
      <div className="space-y-2.5 px-1">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-condensed px-1">
          My Dashboard
        </h3>

        {/* Metric 1: Live Heart Rate */}
        <div className="p-4 rounded-[20px] bg-[#16191E] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#222730] flex items-center justify-center text-zinc-400">
              <Heart className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-300 font-sans">Heart Rate</div>
              <div className="text-[10px] text-zinc-500 font-mono">
                RHR Baseline: {settings.restingHrBaseline} bpm
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live mini sparkline indicator */}
            <div className="flex items-end gap-0.5 h-4 w-10">
              <div className="w-1.5 h-2 bg-[#0093E9] rounded-t" />
              <div className="w-1.5 h-3.5 bg-[#0093E9] rounded-t" />
              <div className="w-1.5 h-2.5 bg-[#0093E9] rounded-t" />
              <div className="w-1.5 h-4 bg-[#0093E9] rounded-t animate-pulse" />
            </div>
            <div className="text-right">
              <span className="text-xl font-black font-condensed text-white tabular-nums">
                {metrics.currentHr !== null ? metrics.currentHr : '--'}
              </span>
              <span className="text-[10px] text-zinc-400 font-sans ml-1">BPM</span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </div>
        </div>

        {/* Metric 2: Real HRV (RMSSD) */}
        <div className="p-4 rounded-[20px] bg-[#16191E] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#222730] flex items-center justify-center text-zinc-400">
              <Activity className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-300 font-sans">Heart Rate Variability</div>
              <div className="text-[10px] text-zinc-500 font-mono">
                Baseline: {settings.hrvBaseline} ms
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xl font-black font-condensed text-white tabular-nums">
                {metrics.currentHrv !== null ? metrics.currentHrv : '--'}
              </span>
              <span className="text-[10px] text-zinc-400 font-sans ml-1">ms</span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </div>
        </div>

        {/* Metric 3: Respiratory Rate (RPM via RSA) */}
        <div className="p-4 rounded-[20px] bg-[#16191E] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#222730] flex items-center justify-center text-zinc-400">
              <Wind className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-300 font-sans">Respiratory Rate</div>
              <div className="text-[10px] text-zinc-500 font-mono">
                RSA Derived • Typical: 13.5 - 16.5 rpm
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xl font-black font-condensed text-white tabular-nums">
                {metrics.respiratoryRate !== null ? metrics.respiratoryRate : '--'}
              </span>
              <span className="text-[10px] text-zinc-400 font-sans ml-1">rpm</span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </div>
        </div>

        {/* Metric 4: Accumulated Calories */}
        <div className="p-4 rounded-[20px] bg-[#16191E] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#222730] flex items-center justify-center text-zinc-400">
              <Flame className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-300 font-sans">Active Calories</div>
              <div className="text-[10px] text-zinc-500 font-mono">
                Keytel Equation Metabolic Burn
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xl font-black font-condensed text-white tabular-nums">
                {metrics.activeCalories}
              </span>
              <span className="text-[10px] text-zinc-400 font-sans ml-1">kcal</span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </div>
        </div>

        {/* Metric 5: Estimated VO2 Max */}
        <div className="p-4 rounded-[20px] bg-[#16191E] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#222730] flex items-center justify-center text-zinc-400">
              <Zap className="w-4 h-4 text-[#16EC06]" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-300 font-sans">Cardiorespiratory VO₂ Max</div>
              <div className="text-[10px] text-zinc-500 font-mono">
                Uth-Sørensen Formula • Aerobic Power
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xl font-black font-condensed text-white tabular-nums">
                {metrics.vo2Max !== null ? metrics.vo2Max : '--'}
              </span>
              <span className="text-[10px] text-zinc-400 font-sans ml-1">ml/kg/min</span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </div>
        </div>

        {/* Metric 5: Raw Beat-to-Beat Interval (RR ms) */}
        <div className="p-4 rounded-[20px] bg-[#16191E] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#222730] flex items-center justify-center text-zinc-400">
              <Timer className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-300 font-sans">Beat-to-Beat Interval</div>
              <div className="text-[10px] text-zinc-500 font-mono">
                Instantaneous Inter-Beat Interval (IBI)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xl font-black font-condensed text-white tabular-nums">
                {metrics.lastRR !== null ? metrics.lastRR : '--'}
              </span>
              <span className="text-[10px] text-zinc-400 font-sans ml-1">ms</span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </div>
        </div>
      </div>

      {/* Health Monitor Sheet Modal */}
      <WhoopHealthMonitor
        metrics={healthMetrics}
        isModal={true}
        isOpen={isHealthMonitorModalOpen}
        onClose={() => setIsHealthMonitorModalOpen(false)}
      />

      {/* Daily Outlook Modal */}
      <DailyOutlookModal
        isOpen={isOutlookModalOpen}
        onClose={() => setIsOutlookModalOpen(false)}
        metrics={metrics}
        settings={settings}
        metadata={metadata}
      />
    </div>
  );
};
