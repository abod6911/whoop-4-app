import React, { useState } from 'react';
import { Sparkles, Zap, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import {
  PREVIEW_DAYS_LIST,
  STREAK_MILESTONE_TIERS,
  type StreakTierConfig,
} from '../../services/streakMilestoneEngine';
import { useLanguage } from '../../i18n/LanguageContext';
import { hapticMedium, hapticLight } from '../../utils/haptics';

interface StreakMilestonePreviewerProps {
  realStreakDays: number;
  activePreviewDays: number | null; // null = LIVE mode
  activeTier: StreakTierConfig;
  onSelectPreview: (days: number | null) => void;
  className?: string;
}

export const StreakMilestonePreviewer: React.FC<StreakMilestonePreviewerProps> = ({
  realStreakDays,
  activePreviewDays,
  activeTier,
  onSelectPreview,
  className = '',
}) => {
  const { isRtl } = useLanguage();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const isPreviewing = activePreviewDays !== null;

  const handleSelect = (days: number | null) => {
    hapticMedium();
    onSelectPreview(days);
  };

  return (
    <div
      className={`rounded-2xl bg-[#0D1015]/90 border border-white/10 p-2.5 transition-all select-none ${className}`}
    >
      {/* Header bar / Toggle */}
      <div className="flex items-center justify-between pb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-md bg-[#FF8800]/20 flex items-center justify-center text-[#FF8800]">
            <Zap className="w-3 h-3 fill-current" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-zinc-300 font-condensed truncate">
            {isRtl ? 'معاينة مستويات الالتزام' : 'MILESTONE TIER SHOWCASE'}
          </span>
          {isPreviewing && (
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {isRtl ? 'وضع الاستعراض' : 'DEMO MODE'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isPreviewing && (
            <button
              onClick={() => handleSelect(null)}
              className="text-[10px] font-mono font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-md flex items-center gap-1 border border-white/5 transition-colors"
              title={isRtl ? 'العودة للسلسلة الحقيقية' : 'Reset to Live'}
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>LIVE</span>
            </button>
          )}

          <button
            onClick={() => {
              hapticLight();
              setIsExpanded(!isExpanded);
            }}
            className="w-6 h-6 rounded-md hover:bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Toggle previewer"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Scrubber Pills Strip */}
      {isExpanded && (
        <div className="pt-1.5 border-t border-white/5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-0.5">
            {/* 1. Live Button */}
            <button
              onClick={() => handleSelect(null)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all ${
                !isPreviewing
                  ? 'bg-[#16EC06]/20 border border-[#16EC06] text-[#16EC06] shadow-[0_0_12px_rgba(22,236,6,0.3)] scale-[1.03]'
                  : 'bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  !isPreviewing ? 'bg-[#16EC06] animate-pulse' : 'bg-zinc-600'
                }`}
              />
              <span>{isRtl ? `مباشر (${realStreakDays}ي)` : `LIVE (${realStreakDays}d)`}</span>
            </button>

            {/* 2. Tier Pills: 5d, 10d, 20d, 30d, 40d, 50d, 60d, 70d, 80d, 90d, 100d+ */}
            {PREVIEW_DAYS_LIST.map((item) => {
              const tierConf = STREAK_MILESTONE_TIERS[item.tierNum];
              const isSelected = activePreviewDays === item.days;

              return (
                <button
                  key={item.days}
                  onClick={() => handleSelect(item.days)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'scale-[1.05] shadow-lg'
                      : 'bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: `${tierConf.colors.primary}25`,
                          borderColor: tierConf.colors.primary,
                          color: tierConf.colors.primary,
                          boxShadow: `0 0 14px ${tierConf.colors.glowRgba}`,
                        }
                      : undefined
                  }
                  title={`${tierConf.name} (${item.days} days)`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: tierConf.colors.primary }}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Preview Tier Sub-Description */}
          {isPreviewing && (
            <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-white uppercase font-condensed">
                  {isRtl ? activeTier.nameAr : activeTier.name}:
                </span>
                <span className="text-zinc-400 font-sans truncate">
                  {isRtl ? activeTier.descriptorAr : activeTier.descriptor}
                </span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500 whitespace-nowrap ml-2">
                Tier {activeTier.tier}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
