import React from 'react';
import { motion } from 'framer-motion';

interface BlazingFlameProps {
  size?: number;
  className?: string;
  showSparks?: boolean;
}

export const BlazingFlame: React.FC<BlazingFlameProps> = ({
  size = 28,
  className = '',
  showSparks = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Radiant Amber Glow Halo */}
      <motion.div
        animate={{
          scale: [0.95, 1.25, 0.95],
          opacity: [0.4, 0.85, 0.4],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 rounded-full bg-gradient-to-t from-[#FF3344] via-[#FF8800] to-[#FFDE00] blur-md pointer-events-none"
      />

      {/* Floating Spark Embers */}
      {showSparks && (
        <>
          <motion.span
            animate={{
              y: [0, -16, -24],
              x: [0, 3, 6],
              opacity: [0, 1, 0],
              scale: [0.8, 1.2, 0.4],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.2,
            }}
            className="absolute w-1 h-1 rounded-full bg-[#FFDE00] pointer-events-none top-1 left-2 shadow-[0_0_6px_#FFDE00]"
          />
          <motion.span
            animate={{
              y: [0, -20, -30],
              x: [0, -4, -8],
              opacity: [0, 1, 0],
              scale: [0.6, 1.1, 0.3],
            }}
            transition={{
              duration: 1.7,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.6,
            }}
            className="absolute w-1 h-1 rounded-full bg-[#FF8800] pointer-events-none top-2 right-2 shadow-[0_0_6px_#FF8800]"
          />
        </>
      )}

      {/* Outer Flickering Crimson Plume */}
      <motion.svg
        viewBox="0 0 24 24"
        style={{ width: size, height: size }}
        className="absolute inset-0 text-[#FF3344] overflow-visible drop-shadow-[0_0_12px_rgba(255,51,68,0.7)]"
        animate={{
          scale: [1, 1.08, 0.96, 1.05, 1],
          rotate: [-2, 2, -1, 3, 0],
        }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <path
          d="M8.5 14.5A4.5 4.5 0 0 0 13 19a4.5 4.5 0 0 0 4.5-4.5c0-2-1.5-3.8-3.5-5.5-.8-.7-1.5-1.5-2-2.5-.5 1-1.2 1.8-2 2.5-2 1.7-3.5 3.5-3.5 5.5z"
          fill="currentColor"
        />
      </motion.svg>

      {/* Middle Blazing Orange Flame */}
      <motion.svg
        viewBox="0 0 24 24"
        style={{ width: size * 0.85, height: size * 0.85 }}
        className="absolute text-[#FF8800] overflow-visible drop-shadow-[0_0_10px_rgba(255,136,0,0.85)]"
        animate={{
          scale: [1, 1.14, 0.94, 1.1, 1],
          rotate: [1, -2, 2, -1, 0],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <path
          d="M8.5 14.5A4.5 4.5 0 0 0 13 19a4.5 4.5 0 0 0 4.5-4.5c0-2-1.5-3.8-3.5-5.5-.8-.7-1.5-1.5-2-2.5-.5 1-1.2 1.8-2 2.5-2 1.7-3.5 3.5-3.5 5.5z"
          fill="currentColor"
        />
      </motion.svg>

      {/* Inner Radiant Yellow Core */}
      <motion.svg
        viewBox="0 0 24 24"
        style={{ width: size * 0.55, height: size * 0.55 }}
        className="absolute text-[#FFDE00] overflow-visible drop-shadow-[0_0_6px_rgba(255,222,0,1)]"
        animate={{
          scale: [0.9, 1.22, 0.85, 1.15, 0.9],
          opacity: [0.8, 1, 0.85, 1, 0.8],
        }}
        transition={{
          duration: 0.9,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <path
          d="M8.5 14.5A4.5 4.5 0 0 0 13 19a4.5 4.5 0 0 0 4.5-4.5c0-2-1.5-3.8-3.5-5.5-.8-.7-1.5-1.5-2-2.5-.5 1-1.2 1.8-2 2.5-2 1.7-3.5 3.5-3.5 5.5z"
          fill="currentColor"
        />
      </motion.svg>
    </div>
  );
};
