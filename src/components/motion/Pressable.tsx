import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { TAP } from './springs';

export interface PressButtonProps extends HTMLMotionProps<'button'> {
  children?: React.ReactNode;
}

export const PressButton = React.forwardRef<HTMLButtonElement, PressButtonProps>(
  ({ children, className = '', whileTap = TAP, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={whileTap}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className={`select-none focus:outline-none ${className}`}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

PressButton.displayName = 'PressButton';

export interface PressCardProps extends HTMLMotionProps<'div'> {
  children?: React.ReactNode;
}

export const PressCard = React.forwardRef<HTMLDivElement, PressCardProps>(
  ({ children, className = '', whileTap = TAP, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileTap={whileTap}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className={`select-none ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

PressCard.displayName = 'PressCard';
