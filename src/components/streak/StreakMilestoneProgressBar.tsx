import React from 'react';
import {
  type StreakTierConfig,
  getTierBracketProgress,
} from '../../services/streakMilestoneEngine';
import { useLanguage } from '../../i18n/LanguageContext';
import { Crown, Sparkles } from 'lucide-react';

interface StreakMilestoneProgressBarProps {
  days: number;
  tier: StreakTierConfig;
  className?: string;
}

export const StreakMilestoneProgressBar: React.FC<StreakMilestoneProgressBarProps> = ({
  days,
  tier,
  className = '',
}) => {
  const { isRtl } = useLanguage();
  const bracket = getTierBracketProgress(days);

  if (bracket.isMaxTier) {
    return (
      <div className={`w-full rounded-2xl bg-white/[0.04] border border-[#FFE57F]/30 p-3 select-none ${className}`}>
        <div className="flex items-center justify-between text-xs font-condensed">
          <div className="flex items-center gap-1.5 text-[#FFE57F] font-black uppercase tracking-wider">
            <Crown className="w-4 h-4 text-[#FFE57F]" />
            <span>{isRtl ? 'المحطة الأسطورية المئوية مكتملة' : 'CENTURION 100 PRESTIGE MAXED'}</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 bg-[#FFE57F]/10 px-2 py-0.5 rounded-full border border-[#FFE57F]/20 text-[#FFE57F]">
            {isRtl ? `${days} دورة متتالية` : `${days} CONSECUTIVE CYCLES`}
          </span>
        </div>
        {/* Full Shimmering Gold Bar */}
        <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden mt-2 relative p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FFE57F] via-[#FFFFFF] to-[#00F0FF] bg-[length:200%_100%] animate-shimmer shadow-[0_0_12px_rgba(255,229,127,0.8)]"
            style={{ width: '100%' }}
          />
        </div>
      </div>
    );
  }

  const nextTier = bracket.nextTier;
  const progressPercent = Math.round(bracket.progressRatio * 100);

  return (
    <div className={`w-full rounded-2xl bg-white/[0.03] border border-white/5 p-3 select-none ${className}`}>
      {/* Top Labels */}
      <div className="flex items-center justify-between text-[11px] font-condensed mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400 font-bold uppercase tracking-wider">
            {isRtl ? bracket.currentTier.nameAr : bracket.currentTier.name}
          </span>
          <span className="text-zinc-600 font-mono text-[10px]">
            ({bracket.bracketMin}d)
          </span>
        </div>

        {nextTier && (
          <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-300">
            <span className="text-zinc-500">{isRtl ? 'باقي للمستوى القادم:' : 'Next Target:'}</span>
            <strong className="text-white font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10" dir="ltr">
              {isRtl ? `${bracket.daysRemaining}ي` : `${bracket.daysRemaining}d`}
            </strong>
          </div>
        )}
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-2 rounded-full bg-black/40 overflow-hidden">
        {/* Fill bar with gradient and shimmer */}
        <div
          className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${tier.colors.progressBarGradient} bg-[length:200%_100%] animate-shimmer relative`}
          style={{
            width: `${Math.max(4, Math.min(100, progressPercent))}%`,
            boxShadow: `0 0 10px ${tier.colors.glowRgba}`,
          }}
        >
          {/* Leading glowing edge dot */}
          <div
            className="absolute top-1/2 -right-1 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#FFFFFF]"
          />
        </div>
      </div>

      {/* Bottom Track Bracket Numbers */}
      <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 mt-1.5">
        <span>{bracket.bracketMin}d</span>
        <span className="text-zinc-400 font-sans font-medium text-[10px]">
          {isRtl
            ? `التقدم نحو ${nextTier?.nameAr || 'المستوى التالي'}: ${progressPercent}%`
            : `${progressPercent}% towards ${nextTier?.name || 'Next Tier'}`}
        </span>
        <span>{bracket.bracketTarget}d</span>
      </div>
    </div>
  );
};
