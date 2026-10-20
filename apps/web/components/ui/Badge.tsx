'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'draft' | 'sent' | 'neutral' | 'accent';
  children: React.ReactNode;
}

export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  const variants = {
    neutral:
      'bg-slate-100/80 text-slate-700 border-slate-200/80 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]',
    draft:
      'bg-amber-50/80 text-amber-800 border-amber-200/80 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]',
    sent:
      'bg-emerald-50/85 text-emerald-800 border-emerald-300/80 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(5,150,105,0.12)]',
    accent:
      'bg-blue-50/85 text-blue-800 border-blue-200/80 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border select-none',
        variants[variant],
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          variant === 'draft' && 'bg-amber-500',
          variant === 'sent' && 'bg-emerald-500',
          variant === 'neutral' && 'bg-slate-400',
          variant === 'accent' && 'bg-blue-500',
        )}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}
