import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import type { LiveMetrics, HrZoneInfo, UserSettings } from '../types/whoop';
import { Flame, Clock, Heart, Activity } from 'lucide-react';

interface LiveChartsProps {
  metrics: LiveMetrics;
  zones: HrZoneInfo[];
  settings: UserSettings;
  hrHistory: Array<{ timestamp: number; hr: number; hrv: number; rr?: number }>;
}

export const LiveCharts: React.FC<LiveChartsProps> = ({
  metrics,
  zones,
  settings,
  hrHistory,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'hr' | 'rr'>('hr');

  // Format seconds to HH:MM:SS or MM:SS
  const formatDuration = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const totalZoneSeconds = Object.values(metrics.zoneSeconds).reduce((a, b) => a + b, 0);

  // Prepare chart data with formatted local time
  const chartData = hrHistory.slice(-60).map((pt) => {
    const d = new Date(pt.timestamp);
    return {
      time: `${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`,
      hr: pt.hr,
      hrv: pt.hrv,
      rr: pt.rr || Math.round((60 / Math.max(30, pt.hr)) * 1000),
    };
  });

  return (
    <div className="space-y-6">
      {/* Real-Time Live Graph Card */}
      <div className="p-5 rounded-2xl bg-whoop-card border border-whoop-border/80 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-whoop-surface text-whoop-cyan">
              <Activity className="w-5 h-5 text-whoop-cyan" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Real-Time Telemetry
                <span className="w-2 h-2 rounded-full bg-whoop-green animate-ping" />
              </h2>
              <p className="text-xs text-whoop-muted">
                {activeChartTab === 'hr' ? 'Continuous Heart Rate stream (BPM)' : 'Raw Beat-to-Beat RR-Intervals (ms)'}
              </p>
            </div>
          </div>

          {/* Chart View Switcher */}
          <div className="flex items-center gap-1 bg-whoop-surface p-1 rounded-xl border border-whoop-border">
            <button
              onClick={() => setActiveChartTab('hr')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeChartTab === 'hr'
                  ? 'bg-whoop-crimson text-white shadow-md shadow-crimson-600/30'
                  : 'text-whoop-muted hover:text-white'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Heart Rate</span>
            </button>
            <button
              onClick={() => setActiveChartTab('rr')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeChartTab === 'rr'
                  ? 'bg-whoop-cyan text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'text-whoop-muted hover:text-white'
              }`}
            >
              <span className="font-mono text-xs">RR</span>
              <span>Intervals</span>
            </button>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="h-64 sm:h-72 w-full pt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {activeChartTab === 'hr' ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF3366" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#FF3366" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="#4B5563"
                    fontSize={11}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#4B5563"
                    fontSize={11}
                    domain={[Math.max(40, settings.restingHrBaseline - 15), Math.max(180, settings.maxHr + 5)]}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121722',
                      borderColor: '#1F293D',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                    labelStyle={{ color: '#94A3B8' }}
                  />
                  <ReferenceLine
                    y={settings.restingHrBaseline}
                    stroke="#3B82F6"
                    strokeDasharray="4 4"
                    label={{ value: 'RHR Base', fill: '#3B82F6', fontSize: 10, position: 'right' }}
                  />
                  <ReferenceLine
                    y={Math.round(settings.maxHr * 0.85)}
                    stroke="#FFB300"
                    strokeDasharray="4 4"
                    label={{ value: 'Threshold', fill: '#FFB300', fontSize: 10, position: 'right' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hr"
                    stroke="#FF3366"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#hrGradient)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="#4B5563"
                    fontSize={11}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#4B5563"
                    fontSize={11}
                    domain={[400, 1600]}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121722',
                      borderColor: '#1F293D',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                    labelStyle={{ color: '#94A3B8' }}
                  />
                  <ReferenceLine
                    y={850}
                    stroke="#00E676"
                    strokeDasharray="4 4"
                    label={{ value: 'Norm (850ms)', fill: '#00E676', fontSize: 10, position: 'right' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rr"
                    stroke="#00F0FF"
                    strokeWidth={2}
                    dot={{ fill: '#00F0FF', r: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-whoop-muted">
              <p className="text-sm">Awaiting live telemetry packet stream...</p>
            </div>
          )}
        </div>

        {/* Live Metrics Quick Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-whoop-border/60">
          <div className="p-2.5 rounded-xl bg-whoop-surface/60 border border-whoop-border/40">
            <div className="text-[10px] uppercase font-bold text-whoop-muted">Active Calories</div>
            <div className="text-lg font-black text-white font-mono flex items-center gap-1.5 mt-0.5">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>{metrics.activeCalories}</span>
              <span className="text-[10px] text-slate-400">kcal</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-whoop-surface/60 border border-whoop-border/40">
            <div className="text-[10px] uppercase font-bold text-whoop-muted">Min / Max HR</div>
            <div className="text-lg font-black text-white font-mono mt-0.5">
              {metrics.minHr === 999 ? '--' : metrics.minHr} / {metrics.maxHr === 0 ? '--' : metrics.maxHr}{' '}
              <span className="text-[10px] text-slate-400">BPM</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-whoop-surface/60 border border-whoop-border/40">
            <div className="text-[10px] uppercase font-bold text-whoop-muted">Rolling SDNN</div>
            <div className="text-lg font-black text-whoop-cyan font-mono mt-0.5">
              {metrics.sdnn}{' '}
              <span className="text-[10px] text-slate-400">ms</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-whoop-surface/60 border border-whoop-border/40">
            <div className="text-[10px] uppercase font-bold text-whoop-muted">Mean RR-Interval</div>
            <div className="text-lg font-black text-whoop-green font-mono mt-0.5">
              {metrics.meanRR}{' '}
              <span className="text-[10px] text-slate-400">ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Zone Heart Rate Distribution */}
      <div className="p-5 rounded-2xl bg-whoop-card border border-whoop-border/80 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Heart Rate Intensity Zones</h3>
            <p className="text-xs text-whoop-muted">Time spent in Edwards physiological training zones</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Total: {formatDuration(totalZoneSeconds)}</span>
          </div>
        </div>

        <div className="space-y-3.5">
          {zones.map((zone) => {
            const durationSec = metrics.zoneSeconds[zone.zone] || 0;
            const percentage = totalZoneSeconds > 0 ? Math.round((durationSec / totalZoneSeconds) * 100) : 0;
            const isCurrentlyInZone = metrics.currentZone === zone.zone;

            return (
              <div
                key={zone.zone}
                className={`p-3 rounded-xl transition-all ${
                  isCurrentlyInZone
                    ? 'bg-whoop-surface border border-whoop-border shadow-md'
                    : 'bg-whoop-surface/40 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: zone.color }}
                    />
                    <span className="font-bold text-white">{zone.name}</span>
                    <span className="text-whoop-muted font-mono text-[11px]">
                      ({zone.minBpm} - {zone.maxBpm} BPM)
                    </span>
                    {isCurrentlyInZone && (
                      <span className="text-[9px] uppercase font-black px-1.5 py-0.2 rounded bg-whoop-border text-white tracking-wider animate-pulse">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-white font-semibold">{formatDuration(durationSec)}</span>
                    <span className="text-whoop-muted text-[11px] w-8 text-right">{percentage}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(percentage, durationSec > 0 ? 2 : 0)}%`,
                      backgroundColor: zone.color,
                      boxShadow: isCurrentlyInZone ? `0 0 10px ${zone.color}` : 'none',
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
