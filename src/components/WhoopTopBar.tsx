import React from 'react';
import type { DeviceMetadata, LiveMetrics, HomeSubTab, MainTabType, UserSettings } from '../types/whoop';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
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
  settings?: UserSettings;
  onOpenProfile?: () => void;
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
  settings,
  onOpenProfile,
}) => {
  const { t, isRtl } = useLanguage();
  const isBatteryLow = metadata.batteryLevel !== null && metadata.batteryLevel < 15;
  const batteryColor = isBatteryLow ? 'text-[#FF3344]' : 'text-white';

  const avatarRingColor = settings?.avatarColor || '#16EC06';
  const getInitials = (nameStr?: string): string => {
    const clean = (nameStr || '').trim();
    if (!clean) return 'AB';
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return clean.slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

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


      {/* Row 1: Balanced 3-Zone Header (WHOOP 4.0 Authentic Ergonomics) */}
      <div className="px-3 sm:px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 flex items-center justify-between gap-2 sm:gap-3 max-w-[430px] mx-auto select-none">
        {/* Left Zone: Athlete Avatar + Streak Mini-Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Athlete Avatar Button (Click opens UserProfileModal) */}
          <button
            onClick={onOpenProfile || onOpenNotifications}
            className="relative flex items-center justify-center p-0.5 group active:scale-[0.96] transition-transform"
            title={isRtl ? 'الملف الشخصي والمعايرة الحيوية' : 'Athlete Profile & Biometrics'}
            aria-label="Athlete Profile"
          >
            <div
              className="w-9 h-9 rounded-full p-[1.5px] flex items-center justify-center overflow-hidden bg-[#1E2530] shadow-md transition-all group-hover:scale-105"
              style={{ border: `2px solid ${avatarRingColor}` }}
            >
              {settings?.avatarUrl ? (
                <img
                  src={settings.avatarUrl}
                  alt={settings.name || 'Athlete'}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-xs font-black font-condensed tracking-wider text-white">
                  {getInitials(settings?.name)}
                </span>
              )}
            </div>

            {/* Subtle Unread Notification Indicator Dot */}
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#00A3FF] border-2 border-[#0B0D10] ring-1 ring-[#00A3FF]/50 animate-pulse" />
            )}
          </button>

          {/* Interactive WHOOP Wear Streak Mini-Badge */}
          {onOpenStreakModal && (
            <StreakBadge onClick={onOpenStreakModal} />
          )}
        </div>

        {/* Center Zone: True Centered Date Selector */}
        <div className="flex-1 flex justify-center items-center min-w-0">
          <div className="inline-flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.07] px-2.5 py-1 rounded-full shadow-inner">
            <button
              onClick={onPrevDate}
              className="p-1 min-w-[20px] min-h-[20px] flex items-center justify-center text-zinc-400 hover:text-white transition-colors active:scale-[0.95]"
              title={isRtl ? 'اليوم التالي' : 'Previous Day'}
              aria-label="Previous Day"
            >
              <ChevronLeft className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={onOpenCalendar}
              className="text-[11px] font-black uppercase text-white font-condensed tracking-wider px-1.5 hover:text-[#00A3FF] transition-colors active:scale-[0.98] truncate max-w-[120px]"
              title={isRtl ? 'فتح تقويم الدورات الفسيولوجية' : 'Open Cycles Calendar'}
            >
              {getLocalizedDate(selectedDate)}
            </button>
            <button
              onClick={onNextDate}
              className="p-1 min-w-[20px] min-h-[20px] flex items-center justify-center text-zinc-400 hover:text-white transition-colors active:scale-[0.95]"
              title={isRtl ? 'اليوم السابق' : 'Next Day'}
              aria-label="Next Day"
            >
              <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Right Zone: Hardware Telemetry Pill Only (Strap & Battery Status) */}
        <div className="flex-shrink-0 flex items-center justify-end">
          <button
            onClick={onOpenStrapSheet}
            className="flex items-center gap-1.5 bg-[#16191E] border border-white/5 hover:border-zinc-700 px-2.5 py-1 min-h-[34px] rounded-full transition-all active:scale-[0.98]"
            title="WHOOP 4.0 Strap & Battery Status"
            aria-label="WHOOP 4.0 Strap & Battery Status"
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
      </div>

      {/* Row 2: 4 Category Sub-Tabs with Animated Indicator (OVERVIEW | SLEEP | RECOVERY | STRAIN) */}
      {mainTab === 'home' ? (
        <div className="mt-1.5 border-t border-white/5 max-w-[430px] mx-auto">
          <div className="grid grid-cols-4 px-2">
            {(['overview', 'sleep', 'recovery', 'strain'] as HomeSubTab[]).map((tab) => {
              const isActive = activeSubTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => onChangeSubTab(tab)}
                  className={`py-2 px-1 min-h-[38px] text-[11px] font-bold uppercase tracking-wider font-condensed relative flex items-center justify-center transition-colors active:scale-[0.98] ${
                    isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <span className="truncate">{subTabLabels[tab]}</span>
                  {isActive && (
                    <motion.div
                      layoutId="subTabActiveIndicator"
                      className="absolute bottom-0 left-2 right-2 h-[2px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-1.5 py-2 px-4 max-w-[430px] mx-auto border-t border-white/5 text-start">
          <span className="text-xs font-black uppercase tracking-wider font-condensed text-zinc-300">
            {getMainTabTitle()}
          </span>
        </div>
      )}
    </div>
  );
};
