import React, { useEffect, useState, useRef } from 'react';
import type { StreakTierConfig } from '../../services/streakMilestoneEngine';

interface StreakOdometerProps {
  value: number;
  tier: StreakTierConfig;
  className?: string;
}

export const StreakOdometer: React.FC<StreakOdometerProps> = ({
  value,
  tier,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const prevValueRef = useRef<number>(value);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const endVal = value;
    prevValueRef.current = endVal;

    if (startVal === endVal) {
      setDisplayValue(endVal);
      return;
    }

    const startTime = performance.now();
    const duration = Math.min(900, Math.max(350, Math.abs(endVal - startVal) * 35));

    const easeOutExpo = (x: number): number => {
      return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    };

    const animateOdometer = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutExpo(progress);
      const current = Math.round(startVal + (endVal - startVal) * eased);

      setDisplayValue(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animateOdometer);
      } else {
        setDisplayValue(endVal);
      }
    };

    animRef.current = requestAnimationFrame(animateOdometer);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [value]);

  const hasChromatic = tier.flame.showChromaticAberration;

  return (
    <div className={`relative inline-flex items-center justify-center font-condensed ${className}`}>
      {/* Chromatic Aberration Shadow Glow */}
      <span
        className={`text-6xl sm:text-7xl font-black tracking-tighter tabular-nums leading-none select-none bg-gradient-to-r ${tier.colors.textGradient} bg-clip-text text-transparent ${
          hasChromatic ? 'animate-chromatic' : ''
        }`}
        style={{
          filter: `drop-shadow(0 6px 20px ${tier.colors.glowRgba})`,
        }}
      >
        {displayValue}
      </span>
    </div>
  );
};
