import React from 'react';
import type { DeviceMetadata, LiveMetrics, HomeSubTab, MainTabType } from '../types/whoop';
import { ChevronLeft, ChevronRight, Bell, Globe, Zap, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

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
  onOpenCalendar?: () => void;
  onOpenStreakModal?: () => void;
  onOpenQuickAction?: () => void;
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

import { useLanguage } from '../i18n/LanguageContext';
import { StreakBadge } from './StreakBadge';

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
  onOpenCalendar,
  onOpenStreakModal,
  onOpenQuickAction,
}) => {
  const { t, isRtl } = useLanguage();
  const isBatteryLow = metadata.batteryLevel !== null && metadata.batteryLevel < 15;
  const batteryColor = isBatteryLow ? 'text-[#FF3344]' : 'text-white';

  const getMainTabTitle = () => {
    switch (mainTab) {
      case 'plan':
        return t('weeklyPlan');
      case 'community':
        return t('communityLeaderboards');
      case 'more':
        return t('settingsHardware');
      default:
        return t('home').toUpperCase();
    }
  };

  const getLocalizedDate = (dateStr: string) => {
    if (dateStr === 'TODAY') return t('today');
    if (dateStr === 'YESTERDAY') return t('yesterday');
    if (isRtl && dateStr.includes('D AGO')) {
      return dateStr.replace('D AGO', ' ' + t('daysAgo'));
    }
    return dateStr;
  };

  const subTabLabels: Record<HomeSubTab, string> = {
    overview: t('overview'),
    sleep: t('sleep'),
    recovery: t('recovery'),
    strain: t('strain'),
  };

  return (
    <div className="sticky top-0 z-40 bg-[#0B0D10]/95 backdrop-blur-md border-b border-white/5">
      {/* Catch-Up Sync Animated Progress Banner */}
      {metadata.isSyncing && (
        <div className={`w-full border-b px-4 py-1.5 flex items-center justify-between text-[10px] font-condensed font-bold transition-all ${
          metadata.syncProgress === 100 || (metadata.syncStatusText && metadata.syncStatusText.includes('✓'))
            ? 'bg-[#16EC06]/15 border-[#16EC06]/30 text-[#16EC06]'
            : 'bg-[#00A3FF]/15 border-[#00A3FF]/30 text-[#00A3FF]'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              metadata.syncProgress === 100 || (metadata.syncStatusText && metadata.syncStatusText.includes('✓'))
                ? 'bg-[#16EC06]'
                : 'bg-[#00A3FF] animate-pulse'
            }`} />
            <span>{metadata.syncStatusText || (isRtl ? 'جاري سحب بيانات النوم من السوار...' : 'Syncing strap memory...')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="tabular-nums font-black">{metadata.syncProgress ?? 0}%</span>
            <div className="w-16 h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#00A3FF] to-[#16EC06] transition-all duration-300"
                style={{ width: `${metadata.syncProgress ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      )}


      {/* Row 1: Top Bar (00:00 in Video) */}
      <div className="px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-2 flex items-center justify-between gap-2 max-w-[430px] mx-auto">
        {/* Left: Athlete Avatar (AB) + Notification Bell Badge + Streak Badge + Quick Add (+) */}
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

          {/* Interactive WHOOP Wear Streak Badge */}
          {onOpenStreakModal && (
            <StreakBadge onClick={onOpenStreakModal} />
          )}

          {/* Relocated Quick Add Action Button (+) */}
          {onOpenQuickAction && (
            <button
              onClick={onOpenQuickAction}
              className="w-[34px] h-[34px] rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white flex items-center justify-center transition-all shadow-sm"
              title={isRtl ? 'إضافة نشاط سريع أو تمرين' : 'Quick Add Activity'}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* Center: Date Selector < TODAY > with Chevrons and Click-to-Calendar */}
        <div className="flex items-center gap-0.5 bg-[#1C212B] px-2 py-1 rounded-full border border-white/5">
          <button
            onClick={onPrevDate}
            className="p-0.5 text-zinc-400 hover:text-white transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={onOpenCalendar}
            className="text-[11px] font-black uppercase text-white font-condensed tracking-widest px-2.5 hover:text-[#00A3FF] transition-colors active:scale-95"
            title={isRtl ? 'فتح تقويم الدورات الفسيولوجية' : 'Open Cycles Calendar'}
          >
            {getLocalizedDate(selectedDate)}
          </button>
          <button
            onClick={onNextDate}
            className="p-0.5 text-zinc-400 hover:text-white transition-colors"
            title="Next Day"
          >
            <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Right: Real Battery % + Vertical Strap Icon + Signal Bars Icon */}
        <button
          onClick={onOpenStrapSheet}
          className="flex items-center gap-1.5 bg-[#16191E] border border-white/5 hover:border-zinc-700 px-2.5 py-1 rounded-full transition-all active:scale-95"
          title="WHOOP 4.0 Strap & Battery Status"
        >
          {metadata.connected && metadata.isCharging ? (
            <span className="flex items-center gap-0.5 text-[#16EC06] text-xs font-black font-condensed animate-pulse">
              <Zap className="w-3 h-3 fill-[#16EC06] text-[#16EC06]" />
              <span className="tabular-nums">{metadata.batteryLevel !== null ? `${metadata.batteryLevel}%` : ''}</span>
            </span>
          ) : (
            <span className={`text-xs font-bold font-condensed tabular-nums tracking-wide ${metadata.connected ? batteryColor : 'text-zinc-500'}`}>
              {metadata.connected && metadata.batteryLevel !== null ? `${metadata.batteryLevel}%` : '--'}
            </span>
          )}
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
                <span>{subTabLabels[tab]}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-white rounded-full shadow-sm" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="py-2 px-4 max-w-[430px] mx-auto border-t border-white/5 text-start">
          <span className="text-xs font-black uppercase tracking-wider font-condensed text-zinc-300">
            {getMainTabTitle()}
          </span>
        </div>
      )}
    </div>
  );
};
