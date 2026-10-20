'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, onCheckedChange, id, label, disabled }: SwitchProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
          checked
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.35)]'
            : 'bg-slate-300/80 hover:bg-slate-400/70 shadow-inner',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span className="sr-only">{label || 'Toggle switch'}</span>
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={cn(
            'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md transform-gpu',
            checked ? 'ml-auto' : 'mr-auto',
          )}
        />
      </button>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-medium text-slate-700 cursor-pointer select-none"
        >
          {label}
        </label>
      )}
    </div>
  );
}
