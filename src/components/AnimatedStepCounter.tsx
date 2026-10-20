import React, { useEffect, useRef, useState } from 'react';

export interface AnimatedStepCounterProps {
  value: number;
  className?: string;
  durationMs?: number; // Capped strictly between 600ms and 800ms
  isPulsing?: boolean;
  resetKey?: string | number; // For user profile switching to instantly snap
  formatter?: (val: number) => string;
}

/**
 * AnimatedStepCounter
 * Enforces smooth time-based rolling number animation capped strictly between 600ms and 800ms.
 * Uses requestAnimationFrame with easeOutCubic / easeOutExpo curves instead of fixed frame increments.
 * Snaps immediately on user profile switches or small live steps (+1/+2).
 */
export const AnimatedStepCounter: React.FC<AnimatedStepCounterProps> = ({
  value,
  className = '',
  durationMs = 650,
  resetKey,
  formatter = (v) => Math.round(v).toLocaleString(),
}) => {
  const [displayedValue, setDisplayedValue] = useState<number>(() => Math.max(0, Math.round(value || 0)));
  const currentValRef = useRef<number>(Math.max(0, Math.round(value || 0)));
  const animRef = useRef<number | null>(null);
  const prevResetKeyRef = useRef<string | number | undefined>(resetKey);

  // Smooth easeOutCubic: 1 - (1 - t)^3
  const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

  // Smooth easeOutExpo for high-speed rolls: 1 - 2^(-10t)
  const easeOutExpo = (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  useEffect(() => {
    const target = Math.max(0, Math.round(value || 0));

    // Profile switch: cancel any running animation and immediately snap with 0 leftover animation
    if (resetKey !== prevResetKeyRef.current) {
      prevResetKeyRef.current = resetKey;
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      currentValRef.current = target;
      setDisplayedValue(target);
      return;
    }

    const start = currentValRef.current;
    const delta = Math.abs(target - start);

    // If identical, do nothing
    if (delta === 0) return;

    // Real-time live walking: single/double step updates (+1 or +2) reflect immediately without animation lag
    if (delta <= 2) {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      currentValRef.current = target;
      setDisplayedValue(target);
      return;
    }

    // Cancel existing animation frame before starting a new one
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }

    // Fixed duration cap: strictly between 600ms and 800ms
    // If step difference > 500, use fast 600ms roll with easeOutExpo
    const effectiveDuration = delta > 500
      ? 600
      : Math.min(800, Math.max(600, durationMs));

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, Math.max(0, elapsed / effectiveDuration));
      
      const eased = delta > 500 ? easeOutExpo(progress) : easeOutCubic(progress);
      const current = Math.round(start + (target - start) * eased);

      currentValRef.current = current;
      setDisplayedValue(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        currentValRef.current = target;
        setDisplayedValue(target);
        animRef.current = null;
      }
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  }, [value, durationMs, resetKey]);

  return (
    <span className={className}>
      {formatter(displayedValue)}
    </span>
  );
};
