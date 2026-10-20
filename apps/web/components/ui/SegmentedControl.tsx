'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  name?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  name = 'segmented-control',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cn(
        'relative inline-flex p-1 rounded-pill glass-strong border border-white/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(31,38,80,0.06)]',
        className,
      )}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={isSelected}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10 inline-flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-pill transition-colors duration-150 select-none min-h-[36px]',
              isSelected ? 'text-blue-900 font-bold' : 'text-slate-600 hover:text-slate-900',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600',
            )}
          >
            {/* Sliding highlighted thumb */}
            {isSelected && (
              <motion.div
                layoutId={`segmented-thumb-${name}`}
                className="absolute inset-0 bg-white rounded-pill shadow-[0_2px_8px_rgba(31,38,80,0.12),inset_0_1px_0_rgba(255,255,255,1)] -z-10"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            {option.icon && <span className="w-4 h-4" aria-hidden="true">{option.icon}</span>}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
