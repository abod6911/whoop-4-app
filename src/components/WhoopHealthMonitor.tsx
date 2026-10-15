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
  CheckCircle2,
} from 'lucide-react';

interface WhoopHealthMonitorProps {
  metrics: HealthMonitorMetric[];
  isOpen?: boolean;
  onClose?: () => void;
  isModal?: boolean;
}

export const WhoopHealthMonitor: React.FC<WhoopHealthMonitorProps> = ({
  metrics,
  isOpen = false,
  onClose,
  isModal = false,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<HealthMonitorMetric | null>(null);

  const activeCount = metrics.filter((m) => m.value !== null).length;

  const getMetricIcon = (key: string) => {
    switch (key) {
      case 'respiratoryRate':
        return <Wind className="w-4 h-4 text-zinc-400" />;
      case 'bloodOxygen':
        return <Droplet className="w-4 h-4 text-zinc-400" />;
      case 'restingHeartRate':
        return <Heart className="w-4 h-4 text-zinc-400" />;
      case 'hrv':
        return <Activity className="w-4 h-4 text-zinc-400" />;
      case 'skinTemp':
        return <Thermometer className="w-4 h-4 text-zinc-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-zinc-400" />;
    }
  };

  const content = (
    <div className="rounded-[20px] bg-[#16191E] border border-white/5 overflow-hidden select-none">
      {/* Card Header */}
      <div className="px-4 py-3.5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#16EC06]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
            Health Monitor
          </h3>
        </div>

        {isModal && onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-[#222730] text-zinc-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {!isModal && (
          <div className="flex items-center gap-1.5 text-[11px] font-black font-condensed tracking-wide">
            {activeCount > 0 ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#16EC06] animate-pulse" />
                <span className="text-[#16EC06]">{activeCount}/5 METRICS IN RANGE</span>
              </>
            ) : (
              <span className="text-zinc-500">CALIBRATING</span>
            )}
          </div>
        )}
      </div>

      {/* Metrics List */}
      <div className="divide-y divide-white/5">
        {metrics.map((m) => (
          <div
            key={m.key}
            onClick={() => setSelectedMetric(m)}
            className="px-4 py-3 flex items-center justify-between hover:bg-[#1E232B] transition-colors cursor-pointer"
          >
            {/* Left: Icon & Label */}
            <div className="w-2/5 flex items-center gap-2.5">
              <div className="flex-shrink-0 text-zinc-400">{getMetricIcon(m.key)}</div>
              <div className="truncate">
                <div className="text-xs font-bold text-white font-sans truncate">{m.label}</div>
                <div className="text-[10px] text-zinc-500 font-mono">{m.typicalRange}</div>
              </div>
            </div>

            {/* Center: Baseline Range Bar */}
            <div className="w-1/4 px-2">
              <div className="relative h-1.5 w-full bg-[#222730] rounded-full overflow-hidden">
                <div className="absolute top-0 bottom-0 left-[25%] right-[25%] bg-zinc-600/60 rounded-full" />
                {m.value !== null && (
                  <div className="absolute top-0 bottom-0 w-2 rounded-full bg-[#16EC06] left-[50%] -ml-1 shadow-sm shadow-green-500/50" />
                )}
              </div>
            </div>

            {/* Right: Value & Status */}
            <div className="w-1/3 flex items-center justify-end gap-2 text-right">
              <div className="text-sm font-black font-condensed text-white tabular-nums tracking-wide">
                {m.value !== null ? m.value : '--'}{' '}
                {m.value !== null && (
                  <span className="text-[10px] font-normal text-zinc-400 uppercase font-sans">
                    {m.unit}
                  </span>
                )}
              </div>

              {m.value !== null ? (
                <div className="flex items-center gap-1 bg-[#0D3528] px-1.5 py-0.5 rounded border border-[#16EC06]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16EC06]" />
                  <span className="text-[10px] font-black text-[#16EC06] font-condensed uppercase tracking-wider">
                    OK
                  </span>
                </div>
              ) : (
                <span className="text-[9px] font-mono text-zinc-500 bg-[#222730] px-1.5 py-0.5 rounded">
                  CALIBRATING
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Metric Detail Modal Popup */}
      {selectedMetric && (
        <div className="p-3 bg-[#0B0D10] border-t border-white/5 flex items-center justify-between text-xs font-condensed">
          <div>
            <span className="font-bold text-white">{selectedMetric.label}: </span>
            <span className="text-zinc-400">
              {selectedMetric.value !== null
                ? `${selectedMetric.value} ${selectedMetric.unit} (${selectedMetric.statusText})`
                : 'Sensor acquiring clean baseline data.'}
            </span>
          </div>
          <button
            onClick={() => setSelectedMetric(null)}
            className="text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-[#16191E]"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );

  if (isModal) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="w-full max-w-[430px] animate-in slide-in-from-bottom-4">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
