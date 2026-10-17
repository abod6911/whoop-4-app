import React, { useEffect, useState } from 'react';
import { Flame, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { streakEngine, type StreakSummary } from '../services/streakEngine';
import { useLanguage } from '../i18n/LanguageContext';
import { hapticLight, hapticMedium } from '../utils/haptics';

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
        className={`rounded-[24px] bg-[#12151A] border border-white/5 hover:border-white/15 p-4 relative overflow-hidden cursor-pointer transition-all group select-none shadow-lg shadow-black/40 ${className}`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#FF8800]/15 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 text-[#FF8800] fill-[#FF8800]" />
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
      className={`flex items-center gap-1.5 bg-[#16191E] border border-white/5 hover:border-zinc-700 px-2.5 py-1 rounded-full transition-all active:scale-95 select-none ${className}`}
      title={isRtl ? `سلسلة البيانات: ${streak} أيام متتالية` : `Data Streak: ${streak} consecutive days`}
    >
      <Flame className="w-3.5 h-3.5 text-[#FF8800] fill-[#FF8800]" />
      <span className="text-xs font-bold font-condensed tabular-nums tracking-wide text-white">
        {streak}
      </span>
      <span className="text-[10px] font-medium font-condensed text-zinc-500 uppercase">
        {isRtl ? 'ي' : 'd'}
      </span>
    </button>
  );
};
