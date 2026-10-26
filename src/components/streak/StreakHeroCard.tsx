import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  type StreakTierConfig,
  getStreakMilestoneTier,
} from '../../services/streakMilestoneEngine';
import { StreakParticleCanvas } from './StreakParticleCanvas';
import { StreakFlameEmblem } from './StreakFlameEmblem';
import { StreakOdometer } from './StreakOdometer';
import { StreakMilestoneProgressBar } from './StreakMilestoneProgressBar';
import { useLanguage } from '../../i18n/LanguageContext';
import { Award, Zap } from 'lucide-react';

interface StreakHeroCardProps {
  days: number;
  realDays: number;
  streakStartDate: string;
  nextMilestoneDaysRemaining?: number;
  burstTrigger: number;
  className?: string;
}

export const StreakHeroCard: React.FC<StreakHeroCardProps> = ({
  days,
  realDays,
  streakStartDate,
  nextMilestoneDaysRemaining,
  burstTrigger,
  className = '',
}) => {
  const { isRtl } = useLanguage();
  const tier = getStreakMilestoneTier(days);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // 3D Card Tilt State for Tier 8-10 Holographic Cards
  const [tilt, setTilt] = useState<{ x: number; y: number; sheenX: number; sheenY: number }>({
    x: 0,
    y: 0,
    sheenX: 50,
    sheenY: 50,
  });
  const [isHovering, setIsHovering] = useState<boolean>(false);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!tier.holographicCard || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      // Calculate tilt angles (max +/- 10 degrees)
      const rotateY = (px - 0.5) * 16;
      const rotateX = (0.5 - py) * 16;

      setTilt({
        x: rotateX,
        y: rotateY,
        sheenX: Math.round(px * 100),
        sheenY: Math.round(py * 100),
      });
    },
    [tier.holographicCard]
  );

  const handlePointerLeave = useCallback(() => {
    setIsHovering(false);
    setTilt({ x: 0, y: 0, sheenX: 50, sheenY: 50 });
  }, []);

  const handlePointerEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const isConic = tier.flame.showConicBorderBeam;

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className={`relative rounded-[28px] select-none transition-transform duration-200 ease-out ${className}`}
      style={{
        perspective: 1000,
        transform:
          tier.holographicCard && isHovering
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
            : 'rotateX(0deg) rotateY(0deg)',
      }}
    >
      {/* 1. Laser-Etched Animated Conic Gradient Spinning Border Beam (Tier 5 & Tier 10) */}
      {isConic && (
        <div className="absolute -inset-[1.5px] rounded-[29px] overflow-hidden pointer-events-none z-0">
          <div
            className="absolute -inset-[150%] animate-border-beam"
            style={{
              background: `conic-gradient(from 0deg, transparent 0 280deg, ${
                tier.colors.conicColors || `${tier.colors.primary}, ${tier.colors.secondary}`
              } 360deg)`,
            }}
          />
        </div>
      )}

      {/* 2. Main Hero Surface Container */}
      <div
        className={`relative rounded-[28px] p-6 overflow-hidden text-center z-10 transition-colors duration-500 ${
          !isConic ? `border ${tier.colors.heroCardBorder}` : 'border border-white/10'
        }`}
        style={{
          background: `linear-gradient(180deg, ${tier.colors.heroCardBgFrom} 0%, ${tier.colors.heroCardBgVia} 45%, ${tier.colors.heroCardBgTo} 100%)`,
          boxShadow: `0 0 40px ${tier.colors.glowRgba}`,
        }}
      >
        {/* Shimmering Ambient Light Sweep */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent bg-[length:200%_100%] animate-shimmer pointer-events-none" />

        {/* 3D Holographic Specular Glare (Tier 8-10) */}
        {tier.holographicCard && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              opacity: isHovering ? 0.35 : 0.15,
              background: `radial-gradient(circle at ${tilt.sheenX}% ${tilt.sheenY}%, rgba(255, 255, 255, 0.45) 0%, rgba(0, 240, 255, 0.15) 30%, transparent 65%)`,
            }}
          />
        )}

        {/* Dynamic HTML5 Canvas Particle Layer */}
        <StreakParticleCanvas tier={tier} burstTrigger={burstTrigger} />

        {/* Card Header: Tier Badge & Telemetry Indicator */}
        <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
          {/* Milestone Tier Badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-condensed font-black uppercase tracking-wider transition-colors duration-500 border"
            style={{
              backgroundColor: `${tier.colors.primary}18`,
              borderColor: `${tier.colors.primary}50`,
              color: tier.colors.primary,
              boxShadow: `0 0 10px ${tier.colors.glowRgba}`,
            }}
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>{isRtl ? tier.badgeLabelAr : tier.badgeLabel}</span>
          </div>

          {/* Continuous Telemetry Sync status */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-300">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: tier.colors.primary }}
            />
            <span className="hidden sm:inline">
              {isRtl ? 'مزامنة حيوية نشطة' : 'ACTIVE TELEMETRY'}
            </span>
            <span className="sm:hidden font-bold">LIVE</span>
          </div>
        </div>

        {/* Center Stage: Multi-layer Animated Flame & Gyroscope Emblem */}
        <div className="relative z-10 flex flex-col items-center justify-center py-2">
          <div className="mb-2">
            <StreakFlameEmblem tier={tier} size={96} />
          </div>

          {/* Odometer Animated Bold Streak Metric */}
          <StreakOdometer value={days} tier={tier} className="mt-1" />

          {/* Consecutive Days Descriptor */}
          <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400 font-condensed mt-2.5">
            {isRtl
              ? days === 1
                ? 'يوم متتالي على المعصم'
                : 'أيام متتالية على المعصم'
              : days === 1
              ? 'CONSECUTIVE DAY COLLECTED'
              : 'CONSECUTIVE DAYS COLLECTED'}
          </span>

          {/* Tier Dynamic Motto / Descriptor */}
          <p className="text-[11px] text-zinc-400 font-sans mt-1 max-w-[280px]">
            {isRtl ? tier.descriptorAr : tier.descriptor}
          </p>
        </div>

        {/* Milestone Progress Bar Inside Hero Card */}
        <div className="relative z-10 mt-4">
          <StreakMilestoneProgressBar days={days} tier={tier} />
        </div>

        {/* Sub-text: Started Date & Countdown */}
        <div className="relative z-10 mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
          <span className="text-zinc-500 text-[10px] whitespace-nowrap">
            {isRtl ? 'بدء الرصد:' : 'Started:'}{' '}
            <strong className="text-zinc-300 font-mono font-normal" dir="ltr">
              {streakStartDate}
            </strong>
          </span>

          {nextMilestoneDaysRemaining !== undefined && nextMilestoneDaysRemaining > 0 && (
            <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5 whitespace-nowrap">
              <span className="text-zinc-500">{isRtl ? 'المحطة القادمة:' : 'Next Milestone:'}</span>{' '}
              <strong className="text-white font-bold" dir="ltr">
                {isRtl ? `${nextMilestoneDaysRemaining}ي` : `${nextMilestoneDaysRemaining}d`}
              </strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
