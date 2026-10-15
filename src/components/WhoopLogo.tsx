import React from 'react';

interface WhoopLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
}

/**
 * Official WHOOP Geometric "W" Emblem
 * - Outer container: Deep pitch-black iOS squircle (#000000, rx="22%") with subtle inner studio rim (stroke="rgba(255,255,255,0.12)")
 * - Inner circle: Crisp white ring (stroke="#FFFFFF", strokeWidth="5.5", fill="none")
 * - Center "W" Monogram:
 *   1. Left angled downward stroke (\) starting top-left and ending cleanly mid-way down (disconnected at bottom, signature WHOOP cut)
 *   2. Center-left long upward diagonal slash (/) extending from bottom-left all the way to top-center
 *   3. Right connected V (\/) starting from mid-height on left leg, dropping to bottom-right vertex, and rising to top-right matching top alignment
 */
export const WhoopEmblemIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 select-none ${className}`}
    >
      {/* Outer pitch-black squircle container with studio rim highlight */}
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="22"
        fill="#000000"
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth="1.5"
      />

      {/* Inner crisp white circular ring */}
      <circle
        cx="50"
        cy="50"
        r="33"
        stroke="#FFFFFF"
        strokeWidth="5.5"
        fill="none"
      />

      {/* Center "W" Monogram - Exact official WHOOP geometric strokes */}
      <g stroke="#FFFFFF" strokeWidth="6" strokeLinecap="butt" strokeLinejoin="miter">
        {/* Stroke 1: Left downward diagonal - disconnected at bottom */}
        <line x1="32" y1="34" x2="40" y2="50" />

        {/* Stroke 2: Long upward diagonal slash - bottom-left to top-center */}
        <line x1="35" y1="66" x2="51" y2="34" />

        {/* Stroke 3: Right connected V - mid-height drop to bottom-right, then up to top-right */}
        <path d="M 46 44 L 58 66 L 68 34" fill="none" />
      </g>
    </svg>
  );
};

export const WhoopLogo: React.FC<WhoopLogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 22,
    md: 28,
    lg: 36,
    xl: 46,
  };

  const textSizes = {
    sm: 'text-xs tracking-[0.24em]',
    md: 'text-sm tracking-[0.28em]',
    lg: 'text-lg tracking-[0.3em]',
    xl: 'text-xl tracking-[0.32em]',
  };

  const s = iconSizes[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official WHOOP Geometric Emblem */}
      <WhoopEmblemIcon size={s} />

      {/* WHOOP Official Slanted Athletic Wordmark */}
      {showWordmark && (
        <span
          className={`font-black uppercase font-condensed tracking-[0.26em] text-white/95 ${textSizes[size]}`}
          style={{ letterSpacing: '0.26em' }}
        >
          WHOOP
        </span>
      )}
    </div>
  );
};
