import React from 'react';

interface WhoopLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
}

export const WhoopLogo: React.FC<WhoopLogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 20,
    md: 26,
    lg: 34,
    xl: 44,
  };

  const textSizes = {
    sm: 'text-sm tracking-[0.25em]',
    md: 'text-base tracking-[0.28em]',
    lg: 'text-xl tracking-[0.3em]',
    xl: 'text-2xl tracking-[0.32em]',
  };

  const s = iconSizes[size];

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* WHOOP Circular "W" Emblem */}
      <svg
        width={s}
        height={s}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Outer segmented ring */}
        <circle
          cx="50"
          cy="50"
          r="44"
          stroke="url(#whoopLogoGrad)"
          strokeWidth="8"
          strokeDasharray="220 50"
          strokeLinecap="round"
        />
        {/* Inner geometric athletic W */}
        <path
          d="M26 34L37 68L50 44L63 68L74 34"
          stroke="white"
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Accent dot / pulse indicator */}
        <circle cx="50" cy="22" r="3.5" fill="#16EC06" />

        <defs>
          <linearGradient id="whoopLogoGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0093E9" />
            <stop offset="0.5" stopColor="#00B4D8" />
            <stop offset="1" stopColor="#16EC06" />
          </linearGradient>
        </defs>
      </svg>

      {/* WHOOP Bold Italic Slanted Wordmark */}
      {showWordmark && (
        <span
          className={`font-black italic uppercase font-sans text-white transform -skew-x-12 ${textSizes[size]}`}
          style={{ letterSpacing: '0.22em' }}
        >
          WHOOP
        </span>
      )}
    </div>
  );
};

export const WhoopEmblemIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 28,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle
        cx="50"
        cy="50"
        r="44"
        stroke="#16EC06"
        strokeWidth="8"
        strokeDasharray="210 60"
        strokeLinecap="round"
      />
      <path
        d="M26 34L37 68L50 44L63 68L74 34"
        stroke="white"
        strokeWidth="8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="22" r="4" fill="#00B4D8" />
    </svg>
  );
};
