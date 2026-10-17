import type { Transition } from 'framer-motion';

/**
 * Standard WHOOP 4.0 Framer Motion Spring Configurations
 */

export const RING_SPRING: Transition = {
  type: 'spring',
  stiffness: 60,
  damping: 15,
  mass: 1,
};

export const SHEET_SPRING: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 34,
  mass: 0.9,
};

export const POP_SPRING: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
};

export const SMOOTH_EASE: Transition = {
  type: 'tween',
  ease: [0.16, 1, 0.3, 1],
  duration: 0.4,
};

export const TAP = {
  scale: 0.98,
};
