import React, { useState } from 'react';
import type { HealthMonitorMetric } from '../types/whoop';
import {
  ShieldCheck,
  ChevronRight,
  Wind,
  Droplet,
  Heart,
  Activity,
  Thermometer,
  Info,
  X,
} from 'lucide-react';

interface WhoopHealthMonitorProps {
  metrics: HealthMonitorMetric[];
}

export const WhoopHealthMonitor: React.FC<WhoopHealthMonitorProps> = ({ metrics }) => {
  const [selectedMetric, setSelectedMetric] = useState<HealthMonitorMetric | null>(null);

  const getMetricIcon = (key: string) => {
    switch (key) {
      case 'respiratoryRate':
        return <Wind className="w-4 h-4 text-[#00B4D8]" />;
      case 'bloodOxygen':
        return <Droplet className="w-4 h-4 text-[#0093E9]" />;
      case 'restingHeartRate':
        return <Heart className="w-4 h-4 text-whoop-red" />;
      case 'hrv':
        return <Activity className="w-4 h-4 text-whoop-green" />;
      case 'skinTemp':
        return <Thermometer className="w-4 h-4 text-whoop-yellow" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-whoop-green" />;
    }
  };

  return (
    <div className="rounded-2xl bg-whoop-card border border-whoop-border overflow-hidden select-none">
      {/* Card Header */}
      <div className="p-4 flex items-center justify-between border-b border-whoop-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-whoop-surface flex items-center justify-center border border-whoop-border">
            <ShieldCheck className="w-4 h-4 text-whoop-green" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              Health Monitor
            </h3>
            <span className="text-[11px] font-bold text-whoop-green font-condensed tracking-wide flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-whoop-green animate-pulse" />
              5/5 METRICS WITHIN RANGE
            </span>
          </div>
        </div>

        <span className="text-[10px] uppercase font-mono text-whoop-muted bg-whoop-surface px-2 py-0.5 rounded border border-whoop-border/50">
          BASELINE OK
        </span>
      </div>

      {/* Metrics Grid / List */}
      <div className="divide-y divide-whoop-border/40">
        {metrics.map((m) => (
          <div
            key={m.key}
            onClick={() => setSelectedMetric(m)}
            className="p-3.5 flex items-center justify-between hover:bg-whoop-surface/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-whoop-surface/80 border border-whoop-border flex items-center justify-center flex-shrink-0">
                {getMetricIcon(m.key)}
              </div>
              <div>
                <div className="text-xs font-bold text-white font-sans">{m.label}</div>
                <div className="text-[10px] text-whoop-muted font-mono">
                  Typical: {m.typicalRange}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <div className="text-sm font-black font-condensed text-white tabular-nums tracking-wide">
                  {m.value}{' '}
                  <span className="text-[10px] font-medium text-whoop-muted uppercase font-sans">
                    {m.unit}
                  </span>
                </div>
                <div className="text-[10px] font-bold text-whoop-green font-condensed uppercase flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-whoop-green" />
                  <span>{m.statusText}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-whoop-muted" />
            </div>
          </div>
        ))}
      </div>

      {/* Metric Detail Modal */}
      {selectedMetric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm p-5 rounded-2xl bg-whoop-card border border-whoop-border shadow-2xl space-y-4">
            <button
              onClick={() => setSelectedMetric(null)}
              className="absolute top-4 right-4 p-1 rounded-full bg-whoop-surface text-whoop-muted hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-whoop-surface border border-whoop-border flex items-center justify-center">
                {getMetricIcon(selectedMetric.key)}
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-white font-condensed">
                  {selectedMetric.label}
                </h4>
                <span className="text-xs font-bold text-whoop-green font-condensed">
                  Status: Within Typical Range
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-whoop-surface/80 border border-whoop-border space-y-2">
              <div className="flex justify-between items-baseline font-mono text-xs">
                <span className="text-whoop-muted">Current Value:</span>
                <span className="text-base font-black text-white">
                  {selectedMetric.value} {selectedMetric.unit}
                </span>
              </div>
              <div className="flex justify-between items-baseline font-mono text-xs">
                <span className="text-whoop-muted">Baseline Window:</span>
                <span className="text-xs text-whoop-gray">{selectedMetric.typicalRange}</span>
              </div>
            </div>

            <p className="text-xs text-whoop-gray leading-relaxed">
              WHOOP calculates your personalized baseline range from your 30-day historical nocturnal readings. Readings within this band indicate healthy autonomic nervous system equilibrium.
            </p>

            <button
              onClick={() => setSelectedMetric(null)}
              className="w-full py-2.5 rounded-xl bg-whoop-blue hover:bg-[#00B4D8] text-black font-black text-xs uppercase tracking-wider font-condensed transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
