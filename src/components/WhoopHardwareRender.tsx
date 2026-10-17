import React from 'react';
import { motion } from 'framer-motion';
import type { DeviceMetadata } from '../types/whoop';
import { whoopBleEngine } from '../services/whoopBleEngine';
import { hapticMedium } from '../utils/haptics';

interface WhoopHardwareRenderProps {
  metadata: DeviceMetadata;
  onTap?: () => void;
  className?: string;
}

export const WhoopHardwareRender: React.FC<WhoopHardwareRenderProps> = ({
  metadata,
  onTap,
  className = '',
}) => {
  const isConnected = metadata.connected;
  const isCharging = metadata.isCharging;
  const battery = metadata.batteryLevel ?? 0;

  const handleTap = async () => {
    hapticMedium();
    if (isConnected) {
      try {
        await whoopBleEngine.triggerStrapVibration('pulse');
        await whoopBleEngine.sendRequestBatteryTemp();
      } catch (e) {
        console.warn('Vibration or battery refresh on tap failed:', e);
      }
    }
    if (onTap) onTap();
  };

  // Determine LED glow color
  const ledColor = !isConnected
    ? '#3F444E'
    : isCharging
    ? '#FFB300'
    : battery >= 20
    ? '#16EC06'
    : '#FF3344';

  const ledGlow = !isConnected
    ? 'rgba(63, 68, 78, 0.2)'
    : isCharging
    ? 'rgba(255, 179, 0, 0.85)'
    : battery >= 20
    ? 'rgba(22, 236, 6, 0.85)'
    : 'rgba(255, 51, 68, 0.85)';

  return (
    <motion.div
      className={`relative flex items-center justify-center select-none cursor-pointer ${className}`}
      onClick={handleTap}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      whileTap={{ scale: 0.96 }}
    >
      {/* Studio Radial Ambient Floor Shadow */}
      <div className="absolute -bottom-8 w-64 h-12 bg-black/60 blur-xl rounded-full pointer-events-none transform scale-y-50" />
      <div className="absolute -bottom-4 w-44 h-8 bg-[#00A3FF]/15 blur-lg rounded-full pointer-events-none" />

      {/* SVG Hardware Illustration of WHOOP 4.0 Strap & Pod */}
      <svg
        viewBox="0 0 340 380"
        className="w-full max-w-[320px] h-auto drop-shadow-2xl overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* SuperKnit Rib Texture Pattern */}
          <pattern id="knitTexture" width="6" height="8" patternUnits="userSpaceOnUse">
            <path
              d="M0 0 L3 4 L0 8 M3 0 L6 4 L3 8"
              fill="none"
              stroke="#2A303C"
              strokeWidth="1.2"
              strokeOpacity="0.45"
            />
          </pattern>

          {/* Pod Matte Charcoal Gradient */}
          <linearGradient id="podBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#252A34" />
            <stop offset="25%" stopColor="#181C23" />
            <stop offset="70%" stopColor="#0F1217" />
            <stop offset="100%" stopColor="#080A0D" />
          </linearGradient>

          {/* Metallic Clasp Chamfer Gradient */}
          <linearGradient id="claspMetal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A5260" />
            <stop offset="35%" stopColor="#2B323D" />
            <stop offset="70%" stopColor="#1A1F26" />
            <stop offset="100%" stopColor="#353D4A" />
          </linearGradient>

          {/* Top LED Slit Glow Filter */}
          <filter id="ledGlowFilter" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={ledGlow} />
          </filter>

          {/* Band Shadow */}
          <linearGradient id="bandShadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#12161D" />
            <stop offset="100%" stopColor="#0A0C0F" />
          </linearGradient>
        </defs>

        {/* 1. SuperKnit Ribbed Strap Band Loop (Left & Right Curving Loop) */}
        {/* Left Strap Ribs */}
        <path
          d="M 60 70 Q 110 30 170 30 Q 230 30 280 70 L 295 190 Q 230 240 170 240 Q 110 240 45 190 Z"
          fill="url(#bandShadow)"
          stroke="#1F242C"
          strokeWidth="3"
        />
        <path
          d="M 60 70 Q 110 30 170 30 Q 230 30 280 70 L 295 190 Q 230 240 170 240 Q 110 240 45 190 Z"
          fill="url(#knitTexture)"
        />

        {/* Band Outer Edge Stitch Accent */}
        <path
          d="M 65 72 Q 112 34 170 34 Q 228 34 275 72"
          fill="none"
          stroke="#384150"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />

        {/* 2. Sensor Pod Housing (Front Matte Shield) */}
        <g transform="translate(100, 110)">
          {/* Pod Cast Drop Shadow */}
          <rect
            x="4"
            y="6"
            width="132"
            height="188"
            rx="28"
            fill="#000000"
            fillOpacity="0.75"
          />

          {/* Outer Chamfer Rim */}
          <rect
            x="0"
            y="0"
            width="140"
            height="196"
            rx="30"
            fill="url(#claspMetal)"
            stroke="#5C6677"
            strokeWidth="1.2"
          />

          {/* Inner Matte Sensor Shell */}
          <rect
            x="7"
            y="7"
            width="126"
            height="182"
            rx="24"
            fill="url(#podBodyGrad)"
          />

          {/* Precision Sensor Bevel Line */}
          <rect
            x="12"
            y="12"
            width="116"
            height="172"
            rx="20"
            fill="none"
            stroke="#1D222A"
            strokeWidth="1.5"
          />

          {/* Top Pill Status LED Indicator */}
          <g transform="translate(56, 24)">
            <rect
              x="0"
              y="0"
              width="28"
              height="6.5"
              rx="3.25"
              fill={ledColor}
              filter="url(#ledGlowFilter)"
            />
            {/* Specular LED Highlight */}
            <rect
              x="3"
              y="1"
              width="22"
              height="2"
              rx="1"
              fill="#FFFFFF"
              fillOpacity={isConnected ? 0.7 : 0.2}
            />
          </g>

          {/* Center Embossed Glossy "W" Monogram */}
          <g transform="translate(42, 68)">
            {/* Recessed Monogram Emboss Shadow */}
            <path
              d="M 12 10 L 22 42 L 31 10 M 27 28 L 38 60 L 46 10"
              fill="none"
              stroke="#07090C"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Front Raised Monogram Silver/White Stroke */}
            <path
              d="M 12 8 L 22 40 L 31 8 M 27 26 L 38 58 L 46 8"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* High-Gloss Core Highlight */}
            <path
              d="M 13 7 L 22 38 L 30 7 M 28 25 L 38 56 L 45 7"
              fill="none"
              stroke="#E8EDF5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.8"
            />
          </g>

          {/* Bottom Fastener / Micro-Latch Hinge */}
          <rect
            x="48"
            y="164"
            width="44"
            height="12"
            rx="4"
            fill="#12151B"
            stroke="#2B323F"
            strokeWidth="1"
          />
          <circle cx="58" cy="170" r="2" fill="#3D4656" />
          <circle cx="82" cy="170" r="2" fill="#3D4656" />
        </g>
      </svg>
    </motion.div>
  );
};
