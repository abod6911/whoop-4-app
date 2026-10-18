import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';

interface CalibratingWaveProps {
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showBars?: boolean;
}

export const CalibratingWave: React.FC<CalibratingWaveProps> = ({
  label,
  className = '',
  size = 'sm',
  showBars = true,
}) => {
  const { t } = useLanguage();
  const text = label || t('calibrating');

  const barHeights = size === 'lg' ? [8, 16, 22, 14, 10] : size === 'md' ? [6, 12, 16, 10] : [4, 9, 13, 7];
  const barWidth = size === 'lg' ? 3 : size === 'md' ? 2.5 : 2;

  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      {showBars && (
        <div className="flex items-center gap-0.5">
          {barHeights.map((h, i) => (
            <motion.span
              key={i}
              className="rounded-full bg-gradient-to-t from-[#00F0FF] to-[#16EC06]"
              style={{ width: barWidth, height: h }}
              animate={{
                scaleY: [0.35, 1, 0.45, 0.9, 0.35],
                opacity: [0.55, 1, 0.65, 0.95, 0.55],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.18,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Shimmering Animated Text */}
      <span className="relative inline-block font-mono font-bold tracking-wider text-[10px] uppercase">
        <span className="bg-gradient-to-r from-zinc-400 via-[#00F0FF] via-[#16EC06] to-zinc-400 bg-[length:250%_100%] bg-clip-text text-transparent animate-[shimmer_2.4s_infinite_linear]">
          {text}
        </span>
      </span>
    </div>
  );
};
