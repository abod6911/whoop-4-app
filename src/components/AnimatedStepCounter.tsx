import React from 'react';

export interface AnimatedStepCounterProps {
  value: number;
  className?: string;
  durationMs?: number;
  isPulsing?: boolean;
  resetKey?: string | number;
  formatter?: (val: number) => string;
}

/**
 * AnimatedStepCounter
 * Direct Hardware Stream Sync: Displays exact physical step count instantly
 * with zero artificial interpolation delays or rolling ticker animations.
 */
export const AnimatedStepCounter: React.FC<AnimatedStepCounterProps> = ({
  value,
  className = '',
  formatter = (v) => Math.round(v).toLocaleString(),
}) => {
  const sanitized = Math.max(0, Math.round(value || 0));
  return (
    <span className={className}>
      {formatter(sanitized)}
    </span>
  );
};
