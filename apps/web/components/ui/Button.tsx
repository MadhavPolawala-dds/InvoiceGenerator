'use client';

import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'pill-primary' | 'pill-secondary';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors select-none ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ' +
      'disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] duration-150';

    const variants = {
      primary:
        'bg-gradient-to-b from-blue-500 to-blue-600 text-white rounded-control ' +
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_20px_rgba(37,99,235,0.32),0_1px_2px_rgba(37,99,235,0.16)] ' +
        'hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 border border-blue-400/40',
      'pill-primary':
        'bg-gradient-to-b from-blue-500 to-blue-600 text-white rounded-pill ' +
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_20px_rgba(37,99,235,0.32),0_1px_2px_rgba(37,99,235,0.16)] ' +
        'hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 border border-blue-400/40',
      secondary:
        'glass-strong text-slate-800 hover:text-slate-950 rounded-control ' +
        'hover:bg-white/90 active:bg-white/70 border border-white/70 hover:border-white ' +
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_16px_rgba(31,38,80,0.06)]',
      'pill-secondary':
        'glass-pill text-slate-800 hover:text-slate-950 ' +
        'hover:bg-white/90 active:bg-white/70 border border-white/80 ' +
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_16px_rgba(31,38,80,0.06)]',
      destructive:
        'bg-gradient-to-b from-red-500 to-red-600 text-white rounded-control ' +
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_20px_rgba(220,38,38,0.25)] ' +
        'hover:from-red-600 hover:to-red-700 border border-red-400/40',
      ghost:
        'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-black/[0.04] rounded-control',
    };

    const sizes = {
      sm: 'text-xs h-9 px-3.5 gap-1.5 min-w-[36px]',
      md: 'text-sm h-11 px-5 gap-2 min-w-[44px]', // WCAG >= 44x44
      lg: 'text-base h-12 px-6 gap-2.5 min-w-[48px]',
      icon: 'h-11 w-11 p-0 flex items-center justify-center rounded-control',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
