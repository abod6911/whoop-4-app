import React from 'react';
import type { DeviceMetadata, LiveMetrics, HomeSubTab, MainTabType } from '../types/whoop';
import { ChevronLeft, ChevronRight, Bell } from 'lucide-react';

interface WhoopTopBarProps {
  metadata: DeviceMetadata;
  metrics: LiveMetrics;
  mainTab: MainTabType;
  activeSubTab: HomeSubTab;
  onChangeSubTab: (tab: HomeSubTab) => void;
  onOpenStrapSheet: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  selectedDate: string;
  onPrevDate: () => void;
  onNextDate: () => void;
}

export const SignalBarsIcon: React.FC<{ isConnected: boolean; className?: string }> = ({
  isConnected,
  className = '',
}) => (
  <svg
    width="13"
    height="11"
    viewBox="0 0 13 11"
    fill="currentColor"
    className={`${isConnected ? 'text-[#16EC06]' : 'text-zinc-600'} ${className}`}
  >
    <rect x="0.5" y="7.5" width="2.5" height="3.5" rx="0.5" />
    <rect x="4.5" y="4.5" width="2.5" height="6.5" rx="0.5" opacity={isConnected ? 1 : 0.4} />
    <rect x="8.5" y="1" width="2.5" height="10" rx="0.5" opacity={isConnected ? 1 : 0.2} />
  </svg>
);

export const VerticalWhoopStrapIcon: React.FC<{ isConnected: boolean; className?: string }> = ({
  isConnected,
  className = '',
}) => (
  <div className={`relative inline-flex items-center justify-center ${className}`}>
    <svg width="17" height="23" viewBox="0 0 18 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top band loop */}
      <rect x="5" y="0.5" width="8" height="3" rx="1.5" fill="#3A404D" />
      {/* Sensor pod body */}
      <rect x="2" y="3.5" width="14" height="17" rx="3.5" fill="#16191E" stroke="#2C323D" strokeWidth="1" />
      {/* Sensor optical window */}
      <circle cx="9" cy="12" r="3.5" fill="#0B0D10" stroke="#2C323D" strokeWidth="0.8" />
      <circle cx="9" cy="12" r="1.5" fill={isConnected ? '#16EC06' : '#52525B'} />
      {/* Bottom band loop */}
      <rect x="5" y="20.5" width="8" height="3" rx="1.5" fill="#3A404D" />
    </svg>
    {/* Real-time status dot */}
    <span
      className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-black ${
        isConnected ? 'bg-[#16EC06]' : 'bg-[#52525B]'
      }`}
    />
  </div>
);

export const WhoopTopBar: React.FC<WhoopTopBarProps> = ({
  metadata,
  mainTab,
  activeSubTab,
  onChangeSubTab,
  onOpenStrapSheet,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  selectedDate,
  onPrevDate,
  onNextDate,
}) => {
  const isBatteryLow = metadata.batteryLevel !== null && metadata.batteryLevel < 15;
  const batteryColor = isBatteryLow ? 'text-[#FF0026]' : 'text-white';

  const getMainTabTitle = () => {
    switch (mainTab) {
      case 'plan':
        return 'WEEKLY PLAN & PROTOCOLS';
      case 'community':
        return 'COMMUNITY & LEADERBOARDS';
      case 'more':
        return 'SETTINGS & HARDWARE';
      default:
        return 'HOME';
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-[#0B0D10]/95 backdrop-blur-md border-b border-white/5">
      {/* Row 1: Top Bar (00:00 in Video) */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2 max-w-[430px] mx-auto">
        {/* Left: Neutral User Avatar Circle (AB) + Notification Bell Badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNotifications}
            className="relative flex items-center justify-center group active:scale-95 transition-transform"
            title="Notification Center"
          >
            {/* Neutral Athlete Initials Circle */}
            <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-tr from-[#1E2530] to-[#2B3545] p-[1.5px] flex items-center justify-center border border-white/10">
              <span className="text-xs font-black font-condensed tracking-wider text-white">
                AB
              </span>
            </div>

            {/* Notification Bell Badge on Avatar */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#16191E] border border-white/20 flex items-center justify-center text-zinc-300">
              <Bell className="w-2.5 h-2.5" />
            </div>

            {/* Unread Counter Dot */}
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#0093E9] text-[9px] font-black font-condensed flex items-center justify-center text-white ring-2 ring-black">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>

        {/* Center: Date Selector < TODAY > with Chevrons */}
        <div className="flex items-center gap-0.5 bg-[#1C212B] px-2 py-1 rounded-full border border-white/5">
          <button
            onClick={onPrevDate}
            className="p-0.5 text-zinc-400 hover:text-white transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-black uppercase text-white font-condensed tracking-widest px-2.5">
            {selectedDate}
          </span>
          <button
            onClick={onNextDate}
            className="p-0.5 text-zinc-400 hover:text-white transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Real Battery % + Vertical Strap Icon + Signal Bars Icon */}
        <button
          onClick={onOpenStrapSheet}
          className="flex items-center gap-2 bg-[#16191E] border border-white/5 hover:border-zinc-700 px-2.5 py-1 rounded-full transition-all active:scale-95"
          title="WHOOP 4.0 Strap & Battery Status"
        >
          <span className={`text-xs font-bold font-condensed tabular-nums tracking-wide ${batteryColor}`}>
            {metadata.batteryLevel !== null ? `${metadata.batteryLevel}%` : '--'}
          </span>
          <VerticalWhoopStrapIcon isConnected={metadata.connected} />
          <SignalBarsIcon isConnected={metadata.connected} />
        </button>
      </div>

      {/* Row 2: 4 Sub-Tabs (OVERVIEW | SLEEP | RECOVERY | STRAIN) on Home Tab (00:00 in Video) */}
      {mainTab === 'home' ? (
        <div className="flex items-center justify-between max-w-[430px] mx-auto px-4 border-t border-white/5">
          {(['overview', 'sleep', 'recovery', 'strain'] as HomeSubTab[]).map((tab) => {
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
        <div className="py-2 px-4 max-w-[430px] mx-auto border-t border-white/5 text-left">
          <span className="text-xs font-black uppercase tracking-wider font-condensed text-zinc-300">
            {getMainTabTitle()}
          </span>
        </div>
      )}
    </div>
  );
};
