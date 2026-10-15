import React, { useState } from 'react';
import type { HealthMonitorMetric } from '../types/whoop';
import {
  Wind,
  Droplet,
  Heart,
  Activity,
  Thermometer,
  ShieldCheck,
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
        return <Wind className="w-3.5 h-3.5 text-zinc-400" />;
      case 'bloodOxygen':
        return <Droplet className="w-3.5 h-3.5 text-zinc-400" />;
      case 'restingHeartRate':
        return <Heart className="w-3.5 h-3.5 text-zinc-400" />;
      case 'hrv':
        return <Activity className="w-3.5 h-3.5 text-zinc-400" />;
      case 'skinTemp':
        return <Thermometer className="w-3.5 h-3.5 text-zinc-400" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div className="rounded-2xl bg-[#101318] border border-[#1E232D] overflow-hidden select-none">
      {/* Card Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[#1E232D]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-whoop-green" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
            Health Monitor
          </h3>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-black text-whoop-green font-condensed tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-whoop-green animate-pulse" />
          <span>5/5 METRICS IN RANGE</span>
        </div>
      </div>

      {/* Metrics List (Official WHOOP Layout: Label -> Range Bar -> Value + OK) */}
      <div className="divide-y divide-[#1A1F28]/60">
        {metrics.map((m) => (
          <div
            key={m.key}
            onClick={() => setSelectedMetric(m)}
            className="px-4 py-3 flex items-center justify-between hover:bg-[#151921] transition-colors cursor-pointer"
          >
            {/* Left: Metric Icon & Title */}
            <div className="w-2/5 flex items-center gap-2.5">
              <div className="flex-shrink-0 text-zinc-400">
                {getMetricIcon(m.key)}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-white font-sans truncate">{m.label}</div>
                <div className="text-[10px] text-zinc-500 font-mono">{m.typicalRange}</div>
              </div>
            </div>

            {/* Center: Baseline Range Bar with Indicator Dot */}
            <div className="w-1/4 px-2">
              <div className="relative h-1.5 w-full bg-[#1C212B] rounded-full overflow-hidden">
                {/* Baseline normal band */}
                <div className="absolute top-0 bottom-0 left-[25%] right-[25%] bg-zinc-600/60 rounded-full" />
                {/* Current dot */}
                <div className="absolute top-0 bottom-0 w-2 rounded-full bg-whoop-green left-[50%] -ml-1 shadow-sm shadow-green-500/50" />
              </div>
            </div>

            {/* Right: Value & OK badge */}
            <div className="w-1/3 flex items-center justify-end gap-2 text-right">
              <div className="text-sm font-black font-condensed text-white tabular-nums tracking-wide">
                {m.value}{' '}
                <span className="text-[10px] font-normal text-zinc-400 uppercase font-sans">
                  {m.unit}
                </span>
              </div>

              <div className="flex items-center gap-1 bg-[#121E18] px-1.5 py-0.5 rounded border border-whoop-green/30">
                <span className="w-1.5 h-1.5 rounded-full bg-whoop-green" />
                <span className="text-[10px] font-black text-whoop-green font-condensed uppercase tracking-wider">
                  OK
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Metric Detail Sheet Modal */}
      {selectedMetric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm p-5 rounded-2xl bg-[#12151A] border border-[#262B35] shadow-2xl space-y-4">
            <button
              onClick={() => setSelectedMetric(null)}
              className="absolute top-4 right-4 p-1 rounded-full bg-[#181C23] text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#181C23] border border-[#262B35] flex items-center justify-center text-zinc-300">
                {getMetricIcon(selectedMetric.key)}
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-white font-condensed">
                  {selectedMetric.label}
                </h4>
                <span className="text-xs font-bold text-whoop-green font-condensed">
                  Within Typical Baseline
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#181C23] border border-[#262B35] space-y-2 font-mono text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-zinc-400">Current Value:</span>
                <span className="text-base font-black text-white">
                  {selectedMetric.value} {selectedMetric.unit}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-zinc-400">Normal Range:</span>
                <span className="text-xs text-zinc-300">{selectedMetric.typicalRange}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              WHOOP monitors your vital autonomic metrics while asleep to calculate personal baselines. Readings within range confirm normal autonomic balance.
            </p>

            <button
              onClick={() => setSelectedMetric(null)}
              className="w-full py-2.5 rounded-xl bg-[#1C222B] hover:bg-[#262E3B] text-white font-black text-xs uppercase tracking-wider font-condensed transition-colors border border-[#2A303C]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
