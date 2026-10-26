import React from 'react';
import { motion } from 'framer-motion';
import type { StreakTierConfig } from '../../services/streakMilestoneEngine';

interface StreakFlameEmblemProps {
  tier: StreakTierConfig;
  size?: number; // default 96 (w-24 h-24)
  className?: string;
}

export const StreakFlameEmblem: React.FC<StreakFlameEmblemProps> = ({
  tier,
  size = 96,
  className = '',
}) => {
  const { flame, colors } = tier;
  const flameScale = flame.flameScale;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 0. Ambient Multi-Stop Glow Halo */}
      <motion.div
        animate={{
          scale: [0.92, 1.18, 0.92],
          opacity: [0.45, 0.85, 0.45],
        }}
        transition={{
          duration: flame.pulseFrequencySec * 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 rounded-full pointer-events-none blur-xl"
        style={{
          background: `radial-gradient(circle, ${colors.primary} 0%, ${colors.secondary} 50%, transparent 75%)`,
        }}
      />

      {/* 1. Tier 10 Centurion: Imperial Laurel Wreath & Crown Crest */}
      {flame.showLaurelCrest && (
        <motion.div
          animate={{
            scale: [0.98, 1.04, 0.98],
            rotate: [-1, 1, -1],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-[-14px] pointer-events-none z-0"
        >
          <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-[0_0_12px_rgba(255,229,127,0.7)]">
            <defs>
              <linearGradient id="laurelGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="35%" stopColor="#FFE57F" />
                <stop offset="70%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#FFA000" />
              </linearGradient>
            </defs>

            {/* Left Laurel Branch */}
            <path
              d="M32 90 C22 76, 20 54, 30 38 C32 35, 36 32, 40 30"
              fill="none"
              stroke="url(#laurelGoldGrad)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Left Leaves */}
            <path d="M26 84 C21 82, 18 76, 22 72 C26 74, 27 79, 26 84 Z" fill="url(#laurelGoldGrad)" />
            <path d="M22 68 C16 66, 14 60, 19 56 C23 58, 24 63, 22 68 Z" fill="url(#laurelGoldGrad)" />
            <path d="M22 52 C17 49, 17 43, 22 39 C26 42, 26 47, 22 52 Z" fill="url(#laurelGoldGrad)" />
            <path d="M26 38 C23 34, 26 28, 31 27 C33 31, 31 36, 26 38 Z" fill="url(#laurelGoldGrad)" />
            <path d="M34 28 C33 23, 38 18, 43 19 C44 23, 40 27, 34 28 Z" fill="url(#laurelGoldGrad)" />

            {/* Right Laurel Branch */}
            <path
              d="M88 90 C98 76, 100 54, 90 38 C88 35, 84 32, 80 30"
              fill="none"
              stroke="url(#laurelGoldGrad)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Right Leaves */}
            <path d="M94 84 C99 82, 102 76, 98 72 C94 74, 93 79, 94 84 Z" fill="url(#laurelGoldGrad)" />
            <path d="M98 68 C104 66, 106 60, 101 56 C97 58, 96 63, 98 68 Z" fill="url(#laurelGoldGrad)" />
            <path d="M98 52 C103 49, 103 43, 98 39 C94 42, 94 47, 98 52 Z" fill="url(#laurelGoldGrad)" />
            <path d="M94 38 C97 34, 94 28, 89 27 C87 31, 89 36, 94 38 Z" fill="url(#laurelGoldGrad)" />
            <path d="M86 28 C87 23, 82 18, 77 19 C76 23, 80 27, 86 28 Z" fill="url(#laurelGoldGrad)" />

            {/* Top Crown Emblem */}
            <path
              d="M52 14 L55 21 L60 16 L65 21 L68 14 L70 23 L50 23 Z"
              fill="url(#laurelGoldGrad)"
            />
            <circle cx="52" cy="13" r="1.5" fill="#FFFFFF" />
            <circle cx="60" cy="15" r="1.5" fill="#FFFFFF" />
            <circle cx="68" cy="13" r="1.5" fill="#FFFFFF" />
          </svg>
        </motion.div>
      )}

      {/* 2. Hexagonal HUD Telemetry Grid (Tier 4+) */}
      {flame.showHexGrid && (
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-0 pointer-events-none opacity-40 z-0"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Hexagon Outline */}
            <polygon
              points="50,6 88,28 88,72 50,94 12,72 12,28"
              fill="none"
              stroke={colors.primary}
              strokeWidth="0.8"
              strokeDasharray="4 6"
            />
            {/* Radial Nodes */}
            <circle cx="50" cy="6" r="1.5" fill={colors.secondary} />
            <circle cx="88" cy="28" r="1.5" fill={colors.secondary} />
            <circle cx="88" cy="72" r="1.5" fill={colors.secondary} />
            <circle cx="50" cy="94" r="1.5" fill={colors.secondary} />
            <circle cx="12" cy="72" r="1.5" fill={colors.secondary} />
            <circle cx="12" cy="28" r="1.5" fill={colors.secondary} />
          </svg>
        </motion.div>
      )}

      {/* 3. Outer Rotating Orbital Telemetry Ring 1 */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: flame.ringSpeedSec,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute inset-[-4px] pointer-events-none z-10"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke={colors.ringColor1}
            strokeWidth="1.6"
            strokeDasharray={flame.ringDash}
          />
          {/* Accent tick notches */}
          <line x1="50" y1="2" x2="50" y2="6" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
          <line x1="98" y1="50" x2="94" y2="50" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="98" x2="50" y2="94" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
          <line x1="2" y1="50" x2="6" y2="50" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </motion.div>

      {/* 4. Counter-Rotating Inner Telemetry Ring 2 (Tier 2+) */}
      {flame.ringCount >= 2 && (
        <motion.div
          animate={{ rotate: -360 }}
          transition={{
            duration: flame.ringSpeedSec * 1.35,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-[4px] pointer-events-none z-10"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={colors.ringColor2}
              strokeWidth="1.2"
              strokeDasharray="3 9"
            />
            {/* Small diamond markers */}
            <circle cx="50" cy="10" r="1.5" fill={colors.secondary} />
            <circle cx="90" cy="50" r="1.5" fill={colors.secondary} />
            <circle cx="50" cy="90" r="1.5" fill={colors.secondary} />
            <circle cx="10" cy="50" r="1.5" fill={colors.secondary} />
          </svg>
        </motion.div>
      )}

      {/* 5. Tilted 3D Gyroscope Ring 3 (Tier 6/7+) */}
      {flame.ringCount >= 3 && colors.ringColor3 && (
        <motion.div
          animate={{
            rotateX: [65, 75, 65],
            rotateZ: [0, 360],
          }}
          transition={{
            rotateX: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
            rotateZ: { duration: flame.ringSpeedSec * 0.9, repeat: Infinity, ease: 'linear' },
          }}
          style={{ perspective: 400, transformStyle: 'preserve-3d' }}
          className="absolute inset-[-8px] pointer-events-none z-10 flex items-center justify-center"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <ellipse
              cx="50"
              cy="50"
              rx="46"
              ry="24"
              fill="none"
              stroke={colors.ringColor3}
              strokeWidth="1.4"
              strokeDasharray="8 6"
            />
          </svg>
        </motion.div>
      )}

      {/* 6. Orbital Data Nodes (Tier 4+) */}
      {flame.showOrbitalNodes && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-[-2px] pointer-events-none z-10"
        >
          {/* Node 1 at 0 deg */}
          <div
            className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
            style={{ backgroundColor: colors.secondary, color: colors.secondary }}
          />
          {/* Node 2 at 120 deg */}
          <div
            className="absolute top-[80%] left-[22%] w-1.5 h-1.5 rounded-full shadow-[0_0_6px_currentColor]"
            style={{ backgroundColor: colors.primary, color: colors.primary }}
          />
          {/* Node 3 at 240 deg */}
          <div
            className="absolute top-[20%] left-[22%] w-1.5 h-1.5 rounded-full shadow-[0_0_6px_currentColor]"
            style={{ backgroundColor: colors.accent || colors.primary, color: colors.accent || colors.primary }}
          />
        </motion.div>
      )}

      {/* 7. Organic Vector Flame Body (Multi-layer SVG) */}
      <div
        className="relative z-20 flex items-center justify-center"
        style={{
          width: size * 0.72 * flameScale,
          height: size * 0.72 * flameScale,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full overflow-visible"
          style={{ filter: `drop-shadow(0 0 14px ${colors.glowRgba})` }}
        >
          <defs>
            {/* Outer Flame Gradient */}
            <linearGradient id={`flameGradOuter-${tier.id}`} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={colors.primary} />
              <stop offset="60%" stopColor={colors.secondary} />
              <stop offset="100%" stopColor={colors.accent || colors.primary} />
            </linearGradient>

            {/* Inner Flame Gradient */}
            <linearGradient id={`flameGradInner-${tier.id}`} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={colors.secondary} />
              <stop offset="70%" stopColor={colors.core} />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>

            {/* Core Nucleus Glow */}
            <filter id={`coreGlow-${tier.id}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Layer A: Outer Thermal Plume with organic flicker */}
          <motion.path
            d="M50 8 C50 8, 65 30, 65 48 C65 58, 60 66, 55 70 C69 58, 74 42, 74 42 C82 56, 84 70, 77 82 C70 94, 56 96, 50 96 C44 96, 30 94, 23 82 C16 70, 18 56, 26 42 C26 42, 31 58, 45 70 C40 66, 35 58, 35 48 C35 30, 50 8, 50 8 Z"
            fill={`url(#flameGradOuter-${tier.id})`}
            animate={{
              scaleY: [1, 1.07, 0.96, 1.05, 1],
              scaleX: [1, 0.96, 1.04, 0.97, 1],
              rotate: [-2, 2, -1, 3, 0],
            }}
            transition={{
              duration: flame.pulseFrequencySec,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ transformOrigin: '50px 92px' }}
          />

          {/* Layer B: Middle Blazing Vector Flame with counter-oscillation */}
          <motion.path
            d="M50 24 C50 24, 60 40, 60 54 C60 62, 56 68, 53 71 C62 62, 65 50, 65 50 C71 60, 71 70, 66 78 C61 86, 52 87, 50 87 C48 87, 39 86, 34 78 C29 70, 29 60, 35 50 C35 50, 38 62, 47 71 C44 68, 40 62, 40 54 C40 40, 50 24, 50 24 Z"
            fill={`url(#flameGradInner-${tier.id})`}
            animate={{
              scaleY: [0.95, 1.12, 0.92, 1.08, 0.95],
              scaleX: [1.03, 0.94, 1.05, 0.96, 1.03],
              rotate: [2, -2, 1, -2, 0],
            }}
            transition={{
              duration: flame.pulseFrequencySec * 0.78,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ transformOrigin: '50px 85px' }}
          />

          {/* Layer C: White-Hot Nucleus Core with Heartbeat Pulse */}
          <motion.path
            d="M50 46 C50 46, 56 56, 56 65 C56 73, 53 78, 50 78 C47 78, 44 73, 44 65 C44 56, 50 46, 50 46 Z"
            fill="#FFFFFF"
            filter={`url(#coreGlow-${tier.id})`}
            animate={{
              scale: [0.9, 1.25, 0.85, 1.2, 0.9],
              opacity: [0.85, 1.0, 0.8, 1.0, 0.85],
            }}
            transition={{
              duration: flame.pulseFrequencySec * 0.55,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ transformOrigin: '50px 68px' }}
          />
        </svg>
      </div>
    </div>
  );
};
