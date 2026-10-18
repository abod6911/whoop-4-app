import React, { useEffect, useState } from 'react';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { streakEngine, type StreakSummary } from '../services/streakEngine';
import { useLanguage } from '../i18n/LanguageContext';
import { hapticLight, hapticMedium } from '../utils/haptics';
import { BlazingFlame } from './motion/BlazingFlame';

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

  const handleClick = () => {
    hapticMedium();
    onClick();
  };

  // 1. Executive Card Variant for Overview / Home Tab
  if (variant === 'card') {
    return (
      <div
        onClick={handleClick}
        className={`rounded-[24px] bg-gradient-to-br from-[#161B22] via-[#12151A] to-[#0E1116] border border-amber-500/25 hover:border-amber-400/50 p-4 relative overflow-hidden cursor-pointer transition-all duration-300 group select-none shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_4px_30px_rgba(255,136,0,0.18)] ${className}`}
      >
        {/* Subtle shimmering gradient flow */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/[0.04] to-transparent bg-[length:200%_100%] animate-shimmer pointer-events-none" />

        <div className="flex items-center justify-between pb-2 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#FF8800]/15 flex items-center justify-center">
              <BlazingFlame size={18} showSparks={true} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.08em] text-zinc-300 font-condensed">
              {isRtl ? 'سلسلة البيانات المتصلة' : 'DATA STREAK'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-400 group-hover:text-white transition-colors">
            <span className="text-[10px] font-mono text-zinc-400">
              {isRtl ? 'عرض المسيرة' : 'View Details'}
            </span>
            <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Main Content */}
        <div className="pt-3 flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black font-condensed text-white tabular-nums tracking-tight">
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
            <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
              {streakData.nextMilestone
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
      className={`flex items-center gap-1.5 bg-[#16191E] border border-amber-500/30 hover:border-amber-400 px-2.5 py-1 rounded-full transition-all active:scale-95 select-none shadow-[0_0_12px_rgba(255,136,0,0.2)] ${className}`}
      title={isRtl ? `سلسلة البيانات: ${streak} أيام متتالية` : `Data Streak: ${streak} consecutive days`}
    >
      <BlazingFlame size={14} showSparks={false} />
      <span className="text-xs font-bold font-condensed tabular-nums tracking-wide text-white">
        {streak}
      </span>
      <span className="text-[10px] font-medium font-condensed text-zinc-400 uppercase">
        {isRtl ? 'ي' : 'd'}
      </span>
    </button>
  );
};
