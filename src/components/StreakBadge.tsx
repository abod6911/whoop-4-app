import React, { useEffect, useState } from 'react';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { streakEngine, type StreakSummary } from '../services/streakEngine';
import { getStreakMilestoneTier } from '../services/streakMilestoneEngine';
import { StreakFlameEmblem } from './streak/StreakFlameEmblem';
import { useLanguage } from '../i18n/LanguageContext';
import { hapticMedium } from '../utils/haptics';

interface StreakBadgeProps {
  onClick: () => void;
  className?: string;
  variant?: 'compact' | 'pill' | 'card';
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  onClick,
  className = '',
  variant = 'compact',
}) => {
  const { isRtl } = useLanguage();
  const [streakData, setStreakData] = useState<StreakSummary>(() =>
    streakEngine.getStreakSummary()
  );

  useEffect(() => {
    return streakEngine.subscribe(setStreakData);
  }, []);

  const streak = streakData.currentStreak;
  const tier = getStreakMilestoneTier(streak);

  const handleClick = () => {
    hapticMedium();
    onClick();
  };

  // 1. Executive Card Variant for Overview / Home Tab
  if (variant === 'card') {
    return (
      <div
        onClick={handleClick}
        className={`rounded-[24px] p-4 relative overflow-hidden cursor-pointer transition-all duration-300 group select-none shadow-[0_4px_24px_rgba(0,0,0,0.5)] ${className}`}
        style={{
          background: `linear-gradient(135deg, ${tier.colors.heroCardBgFrom} 0%, ${tier.colors.heroCardBgVia} 50%, ${tier.colors.heroCardBgTo} 100%)`,
          border: `1px solid ${tier.colors.glowBorder}`,
          boxShadow: `0 4px 28px ${tier.colors.glowRgba}`,
        }}
      >
        {/* Subtle shimmering gradient flow */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent bg-[length:200%_100%] animate-shimmer pointer-events-none" />

        <div className="flex items-center justify-between pb-2 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{
                backgroundColor: `${tier.colors.primary}18`,
                boxShadow: `0 0 10px ${tier.colors.glowRgba}`,
              }}
            >
              <StreakFlameEmblem tier={tier} size={22} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-[0.08em] text-zinc-300 font-condensed">
                {isRtl ? 'سلسلة البيانات المتصلة' : 'DATA STREAK'}
              </span>
              <span
                className="text-[9px] font-mono px-1.5 py-0.2 rounded-full border"
                style={{
                  color: tier.colors.primary,
                  borderColor: `${tier.colors.primary}40`,
                  backgroundColor: `${tier.colors.primary}15`,
                }}
              >
                {isRtl ? tier.badgeLabelAr : tier.badgeLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-400 group-hover:text-white transition-colors">
            <span className="text-[10px] font-mono text-zinc-400">
              {isRtl ? 'عرض المسيرة' : 'View Details'}
            </span>
            <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Main Content */}
        <div className="pt-3 flex items-end justify-between relative z-10">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-3xl font-black font-condensed tabular-nums tracking-tight bg-gradient-to-r ${tier.colors.textGradient} bg-clip-text text-transparent`}
                style={{
                  filter: `drop-shadow(0 2px 8px ${tier.colors.glowRgba})`,
                }}
              >
                {streak}
              </span>
              <span className="text-xs font-bold font-condensed text-zinc-400 uppercase tracking-wider">
                {isRtl
                  ? streak === 1
                    ? 'يوم متتالي'
                    : 'أيام متتالية'
                  : streak === 1
                  ? 'DAY'
                  : 'DAYS'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans mt-0.5 max-w-[240px] truncate">
              {streak === 0
                ? isRtl
                  ? 'ابدأ ارتداء سوارك اليوم لتسجيل أول دورة'
                  : 'Wear your strap today to start your streak'
                : streakData.nextMilestone
                ? isRtl
                  ? `باقي ${streakData.nextMilestone.daysRemaining} أيام على محطة ${streakData.nextMilestone.titleAr}`
                  : `${streakData.nextMilestone.daysRemaining} days until ${streakData.nextMilestone.title}`
                : isRtl
                ? 'اكتمال كافة محطات الرصد السنوية'
                : 'All annual cycle milestones achieved'}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
              <span>{isRtl ? 'أطول سلسلة:' : 'Best:'}</span>
              <span className="text-white font-bold" dir="ltr">{streakData.longestStreak}d</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-[#16EC06]">
              <CheckCircle2 className="w-3 h-3" />
              <span>{streakData.consistencyRate}% {isRtl ? 'انتظام' : 'sync'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Compact Minimalist Pill for Top Header (Identical to WHOOP iOS Header)
  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 bg-[#16191E] border px-2.5 py-1 rounded-full transition-all active:scale-95 select-none ${className}`}
      style={{
        borderColor: `${tier.colors.primary}50`,
        boxShadow: `0 0 12px ${tier.colors.glowRgba}`,
      }}
      title={isRtl ? `سلسلة البيانات: ${streak} أيام متتالية (${tier.nameAr})` : `Data Streak: ${streak} consecutive days (${tier.name})`}
    >
      <StreakFlameEmblem tier={tier} size={15} />
      <span
        className={`text-xs font-bold font-condensed tabular-nums tracking-wide bg-gradient-to-r ${tier.colors.textGradient} bg-clip-text text-transparent`}
      >
        {streak}
      </span>
      <span className="text-[10px] font-medium font-condensed text-zinc-400 uppercase">
        {isRtl ? 'ي' : 'd'}
      </span>
    </button>
  );
};
