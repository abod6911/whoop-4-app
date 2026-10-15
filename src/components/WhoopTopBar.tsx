import React from 'react';
import type { DeviceMetadata, LiveMetrics, HomeSubTab, MainTabType } from '../types/whoop';
import {
  Activity,
  Battery,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';

interface WhoopTopBarProps {
  metadata: DeviceMetadata;
  metrics: LiveMetrics;
  mainTab: MainTabType;
  activeSubTab: HomeSubTab;
  onChangeSubTab: (tab: HomeSubTab) => void;
  onOpenStrapSheet: () => void;
  selectedDate: string;
  onPrevDate: () => void;
  onNextDate: () => void;
}

export const WhoopTopBar: React.FC<WhoopTopBarProps> = ({
  metadata,
  metrics,
  mainTab,
  activeSubTab,
  onChangeSubTab,
  onOpenStrapSheet,
  selectedDate,
  onPrevDate,
  onNextDate,
}) => {
  const pulseDuration = metrics.currentHr > 0 ? (60 / metrics.currentHr).toFixed(2) : '1.0';

  const getMainTabTitle = () => {
    switch (mainTab) {
      case 'coaching':
        return 'COACHING';
      case 'activity':
        return 'LIVE ACTIVITY';
      case 'strap':
        return 'WHOOP 4.0 STRAP & BLE LAB';
      case 'more':
        return 'SETTINGS & BASelines';
      default:
        return 'HOME';
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-[#1E232D]">
      {/* Upper Status Bar */}
      <div className="px-3.5 pt-3 pb-2 flex items-center justify-between gap-2 max-w-[430px] mx-auto">
        {/* Left: User Avatar & Streak */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-whoop-blue via-whoop-cyan to-whoop-green p-[1.5px] flex items-center justify-center">
            <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-xs font-black text-white font-condensed">
              AP
            </div>
          </div>
          <div className="flex items-center gap-1 bg-[#12151A] border border-[#262B35] px-2 py-0.5 rounded-full">
            <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
            <span className="text-[11px] font-black text-white font-condensed tracking-wide">
              14 D
            </span>
          </div>
        </div>

        {/* Center: Date Selector Carousel Pill */}
        <div className="flex items-center gap-1 bg-[#12151A] border border-[#262B35] px-1.5 py-0.5 rounded-full">
          <button
            onClick={onPrevDate}
            className="p-1 rounded-full hover:bg-[#1E232D] text-zinc-400 hover:text-white transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-black uppercase text-white font-condensed tracking-widest px-1.5">
            {selectedDate}
          </span>
          <button
            onClick={onNextDate}
            className="p-1 rounded-full hover:bg-[#1E232D] text-zinc-400 hover:text-white transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: WHOOP 4.0 Strap Status Pill (Opens Bottom Sheet Modal) */}
        <button
          onClick={onOpenStrapSheet}
          className="flex items-center gap-1.5 bg-[#12151A] border border-[#262B35] hover:border-zinc-500 px-2.5 py-1 rounded-full transition-all active:scale-95"
          title="WHOOP 4.0 Strap & Battery Status"
        >
          {/* Beating Heart Icon */}
          <div
            className="text-whoop-red flex items-center justify-center"
            style={{
              animation: metrics.currentHr > 0 ? `heartbeat ${pulseDuration}s ease-in-out infinite` : 'none',
            }}
          >
            <Activity className="w-3.5 h-3.5 text-whoop-red fill-whoop-red" />
          </div>

          <span className="text-xs font-black font-condensed text-white tabular-nums tracking-wide">
            {metrics.currentHr > 0 ? metrics.currentHr : '--'}
          </span>

          {/* Battery Icon */}
          <div className="flex items-center gap-0.5 text-[10px] font-mono text-zinc-400 pl-1 border-l border-[#262B35]">
            <Battery
              className={`w-3.5 h-3.5 ${
                (metadata.batteryLevel ?? 80) < 20
                  ? 'text-whoop-red'
                  : (metadata.batteryLevel ?? 80) < 50
                  ? 'text-whoop-yellow'
                  : 'text-whoop-green'
              }`}
            />
            <span>{metadata.batteryLevel ?? 88}%</span>
          </div>
        </button>
      </div>

      {/* Conditional Sub-Tabs: ONLY VISIBLE WHEN mainTab === 'home' */}
      {mainTab === 'home' ? (
        <div className="flex items-center justify-between max-w-[430px] mx-auto px-4 border-t border-[#1E232D]">
          {(['overview', 'strain', 'recovery', 'sleep'] as HomeSubTab[]).map((tab) => {
            const isActive = activeSubTab === tab;
            return (
              <button
                key={tab}
                onClick={() => onChangeSubTab(tab)}
                className={`py-2 px-3 text-xs font-black uppercase tracking-wider font-condensed relative transition-colors ${
                  isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span>{tab}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-white rounded-full shadow-sm" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="py-2 px-4 max-w-[430px] mx-auto border-t border-[#1E232D] text-left">
          <span className="text-xs font-black uppercase tracking-wider font-condensed text-white">
            {getMainTabTitle()}
          </span>
        </div>
      )}
    </div>
  );
};
