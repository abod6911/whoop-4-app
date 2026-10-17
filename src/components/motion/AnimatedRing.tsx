import React from 'react';
import { motion } from 'framer-motion';
import { RING_SPRING } from './springs';

interface AnimatedRingProps {
  radius: number;
  strokeWidth: number;
  progress: number; // 0.0 to 1.0 (or > 1.0 for overreaching)
  strokeColor: string; // Hex color or 'url(#gradientId)'
  trackColor?: string;
  glow?: boolean;
  glowColor?: string;
  glowBlur?: number;
  className?: string;
  children?: React.ReactNode;
}

export const AnimatedRing: React.FC<AnimatedRingProps> = ({
  radius,
  strokeWidth,
  progress,
  strokeColor,
  trackColor = '#181C23',
  glow = false,
  glowColor,
  glowBlur = 12,
  className = '',
  children,
}) => {
  const size = (radius + strokeWidth) * 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1.2, progress));
  const targetOffset = circumference - clamped * circumference;

  const resolvedGlowColor = glowColor || (strokeColor.startsWith('#') ? strokeColor : '#16EC06');

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible -rotate-90 transform"
      >
        {/* Background Track Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Animated Progress Circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={RING_SPRING}
          style={{
            filter: glow ? `drop-shadow(0 0 ${glowBlur}px ${resolvedGlowColor})` : undefined,
          }}
        />
      </svg>

      {/* Center content / metric */}
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
};
