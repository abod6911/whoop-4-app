import React from 'react';
import { motion } from 'framer-motion';

interface BatteryPackVectorIconProps {
  isCharging?: boolean;
  size?: number; // width in px
  className?: string;
}

export const BatteryPackVectorIcon: React.FC<BatteryPackVectorIconProps> = ({
  isCharging = false,
  size = 40,
  className = '',
}) => {
  const height = Math.round(size * 1.25);

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height }}
    >
      <svg
        viewBox="0 0 64 80"
        className="w-full h-full overflow-visible drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
      >
        <defs>
          {/* Main Pack Metallic Chassis Gradient */}
          <linearGradient id="packChassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2E3440" />
            <stop offset="45%" stopColor="#1B1F27" />
            <stop offset="100%" stopColor="#0F1217" />
          </linearGradient>

          {/* Chamfer Highlight */}
          <linearGradient id="packHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.28)" />
            <stop offset="40%" stopColor="rgba(255, 255, 255, 0.08)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0.4)" />
          </linearGradient>

          {/* LED Glow Filter */}
          <filter id="packLedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Shadow & Slide-on Rail Grooves */}
        <rect
          x="6"
          y="6"
          width="52"
          height="68"
          rx="15"
          fill="#080A0D"
        />

        {/* Side Slide-on Clamps (Left & Right) */}
        <path
          d="M6 22 C6 18, 9 16, 9 16 L9 64 C9 64, 6 62, 6 58 Z"
          fill="#14171E"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.8"
        />
        <path
          d="M58 22 C58 18, 55 16, 55 16 L55 64 C55 64, 58 62, 58 58 Z"
          fill="#14171E"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.8"
        />

        {/* Main Capsule Body */}
        <rect
          x="8"
          y="8"
          width="48"
          height="64"
          rx="13"
          fill="url(#packChassisGrad)"
          stroke="url(#packHighlight)"
          strokeWidth="1.2"
        />

        {/* Subtle Matte Inner Contour */}
        <rect
          x="12"
          y="12"
          width="40"
          height="56"
          rx="9"
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="1"
        />

        {/* Engraved WHOOP 'W' Minimalist Logo */}
        <g
          stroke={isCharging ? '#16EC06' : '#525B6C'}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="transition-colors duration-300"
          style={{
            filter: isCharging ? 'drop-shadow(0 0 4px rgba(22, 236, 6, 0.6))' : 'none',
          }}
        >
          {/* WHOOP W: 4 angled strokes forming the double chevron */}
          <path d="M21 34 L26 49 L32 37 L38 49 L43 34" />
        </g>

        {/* Top Status LED Indicator */}
        {isCharging ? (
          <g filter="url(#packLedGlow)">
            <circle cx="32" cy="18" r="2.8" fill="#16EC06" />
            <circle cx="32" cy="18" r="1.4" fill="#FFFFFF" />
          </g>
        ) : (
          <circle cx="32" cy="18" r="2.2" fill="#525B6C" opacity="0.75" />
        )}
      </svg>

      {/* Radiant Glow Pulse when Charging */}
      {isCharging && (
        <motion.div
          animate={{ scale: [0.95, 1.3, 0.95], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-2xl bg-[#16EC06]/15 blur-md pointer-events-none"
        />
      )}
    </div>
  );
};
