'use client';

import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      hint,
      startAdornment,
      endAdornment,
      id: customId,
      required,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-semibold text-slate-700 tracking-tight flex items-center gap-1 select-none"
          >
            {label}
            {required && <span className="text-red-500 font-bold" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {startAdornment && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none select-none flex items-center justify-center">
              {startAdornment}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            type={type}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? errorId : hint ? hintId : undefined
            }
            className={cn(
              'w-full h-11 px-3.5 text-sm rounded-input text-slate-900 placeholder:text-slate-400',
              'bg-white/80 backdrop-blur-md border border-white/90',
              'shadow-[inset_0_1px_2px_rgba(0,0,0,0.03),0_2px_8px_rgba(31,38,80,0.04)]',
              'transition-all duration-150',
              'focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 focus:shadow-[0_2px_12px_rgba(37,99,235,0.08)]',
              'disabled:bg-slate-100/60 disabled:text-slate-400 disabled:cursor-not-allowed',
              startAdornment && 'pl-9',
              endAdornment && 'pr-9',
              error &&
                'border-red-400 bg-red-50/40 text-red-950 focus:border-red-600 focus:ring-4 focus:ring-red-500/15 focus:shadow-[0_2px_12px_rgba(220,38,38,0.08)]',
              className,
            )}
            {...props}
          />

          {endAdornment && (
            <div className="absolute right-3.5 text-slate-400 pointer-events-none select-none flex items-center justify-center">
              {endAdornment}
            </div>
          )}
        </div>

        {hint && !error && (
          <p id={hintId} className="text-xs text-slate-500">
            {hint}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-medium text-red-600 flex items-center gap-1.5 animate-fadeIn"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
