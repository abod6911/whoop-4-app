import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { streakEngine, type StreakSummary } from '../services/streakEngine';
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

  const handleClick = () => {
    hapticMedium();
    onClick();
  };

  if (variant === 'card') {
    return (
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full p-4 rounded-2xl bg-gradient-to-br from-[#1A1813] via-[#121418] to-[#0D0F14] border border-[#FF7A00]/20 hover:border-[#FF7A00]/40 flex items-center justify-between text-start shadow-lg group relative overflow-hidden transition-all ${className}`}
      >
        {/* Ambient flame glow background */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#FF6A00]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#FF5100]/20 to-[#FF9E00]/30 border border-[#FF7A00]/40 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5 text-[#FF7A00] fill-[#FF7A00] animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-[#FF9E00] font-condensed">
              {isRtl ? 'الالتزام والستريك' : 'WEAR STREAK'}
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black font-condensed text-white tabular-nums tracking-tight">
                {streak}
              </span>
              <span className="text-xs font-bold font-condensed text-zinc-400 uppercase">
                {isRtl ? 'أيام متتالية' : streak === 1 ? 'DAY' : 'DAYS'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end relative z-10">
          <span className="text-[10px] font-bold font-mono text-[#16EC06] bg-[#16EC06]/10 px-2 py-0.5 rounded-full border border-[#16EC06]/20">
            {streakData.consistencyRate}% {isRtl ? 'انتظام' : 'CONSISTENCY'}
          </span>
          <span className="text-[10px] text-zinc-500 font-condensed uppercase mt-1">
            {streakData.nextMilestone
              ? isRtl
                ? `باقي ${streakData.nextMilestone.daysRemaining} يوم للنادي التالي`
                : `${streakData.nextMilestone.daysRemaining}d to next club`
              : isRtl
              ? 'مستوى أسطوري'
              : 'Legendary'}
          </span>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.94 }}
      className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#FF6A00]/15 via-[#FF3B00]/10 to-[#FF9E00]/15 border border-[#FF7A00]/30 hover:border-[#FF7A00]/60 active:border-[#FF7A00] transition-all shadow-[0_0_12px_rgba(255,106,0,0.15)] group ${className}`}
      title={isRtl ? `التزامك الحالي: ${streak} أيام` : `Current Streak: ${streak} Days`}
    >
      {/* Animated Flame Icon */}
      <div className="relative flex items-center justify-center">
        <Flame className="w-3.5 h-3.5 text-[#FF7A00] fill-[#FF7A00] group-hover:scale-110 transition-transform drop-shadow-[0_0_6px_rgba(255,122,0,0.6)]" />
        <span className="absolute -inset-1 rounded-full bg-[#FF7A00]/20 animate-ping opacity-40 pointer-events-none" />
      </div>

      {/* Streak Number */}
      <span className="text-xs font-black font-condensed tracking-wide text-white tabular-nums drop-shadow-sm">
        {streak}
        <span className="text-[10px] font-bold text-[#FF9E00] ml-0.5 uppercase">
          {isRtl ? 'ي' : 'd'}
        </span>
      </span>
    </motion.button>
  );
};
