'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
}

export interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  allowClear?: boolean;
  align?: 'left' | 'right';
}

export function Select({
  label,
  value,
  onChange,
  onBlur,
  options,
  placeholder = 'Select an option...',
  error,
  hint,
  required,
  disabled,
  id: customId,
  name,
  className,
  allowClear = false,
  align = 'left',
}: SelectProps) {
  const generatedId = useId();
  const id = customId || generatedId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isOpen) {
          setIsOpen(false);
          onBlur?.();
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onBlur]);

  // Handle keyboard
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        setIsOpen(false);
        onBlur?.();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        const currentIndex = options.findIndex((o) => o.value === value);
        const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        onChange?.(options[nextIndex].value);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const currentIndex = options.findIndex((o) => o.value === value);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        onChange?.(options[prevIndex].value);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        setIsOpen(false);
        onBlur?.();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, options, value, onChange, onBlur]);

  const handleSelect = (val: string) => {
    onChange?.(val);
    setIsOpen(false);
    onBlur?.();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('');
    onBlur?.();
  };

  return (
    <div
      ref={containerRef}
      className={cn('w-full flex flex-col gap-1.5 relative', isOpen && 'z-50')}
    >
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-slate-700 tracking-tight flex items-center gap-1 select-none"
        >
          {label}
          {required && (
            <span className="text-red-500 font-bold" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {/* Select Trigger */}
      <div className="relative">
        <button
          type="button"
          id={id}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn(
            'w-full h-11 px-3.5 text-left text-sm rounded-input',
            'bg-white/80 backdrop-blur-md border border-white/90',
            'shadow-[inset_0_1px_2px_rgba(0,0,0,0.03),0_2px_8px_rgba(31,38,80,0.04)]',
            'transition-all duration-150 flex items-center justify-between',
            'hover:bg-white/95 hover:border-blue-300',
            'focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 focus:shadow-[0_2px_12px_rgba(37,99,235,0.08)]',
            isOpen && 'bg-white border-blue-600 ring-4 ring-blue-500/15 shadow-sm',
            disabled && 'bg-slate-100/60 text-slate-400 cursor-not-allowed',
            error &&
              'border-red-400 bg-red-50/40 text-red-950 focus:border-red-600 focus:ring-4 focus:ring-red-500/15 focus:shadow-[0_2px_12px_rgba(220,38,38,0.08)]',
            className,
          )}
        >
          <div className="flex items-center gap-2 truncate pr-2">
            {selectedOption?.icon && (
              <span className="shrink-0 text-slate-500">{selectedOption.icon}</span>
            )}
            <span
              className={cn(
                'truncate font-medium',
                selectedOption ? 'text-slate-900' : 'text-slate-400 font-normal',
              )}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            {selectedOption?.badge && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-pill bg-blue-50 text-blue-700 border border-blue-200/80">
                {selectedOption.badge}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            {allowClear && value && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                aria-label="Clear selection"
                className="w-5 h-5 rounded-full hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </span>
            )}
            <ChevronDown
              className={cn(
                'w-4 h-4 text-slate-400 transition-transform duration-200',
                isOpen && 'rotate-180 text-blue-600',
              )}
            />
          </div>
        </button>

        {/* Hidden input for form submission */}
        <input
          type="hidden"
          name={name}
          value={value || ''}
          required={required}
        />
      </div>

      {/* Floating Menu Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="listbox"
            className={cn(
              'absolute top-[calc(100%+6px)] z-[9999] min-w-[200px] w-full max-h-64 overflow-y-auto p-1.5 rounded-2xl bg-white/95 border border-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.18),0_0_0_1px_rgba(0,0,0,0.04)] backdrop-blur-2xl',
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    'w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between gap-3 group',
                    isSelected
                      ? 'bg-blue-600/10 text-blue-900 font-bold'
                      : 'text-slate-700 hover:bg-slate-100/70 hover:text-slate-900',
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {opt.icon && (
                      <span
                        className={cn(
                          'shrink-0',
                          isSelected ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600',
                        )}
                      >
                        {opt.icon}
                      </span>
                    )}
                    <div className="truncate">
                      <span className="block truncate">{opt.label}</span>
                      {opt.description && (
                        <span className="block text-[10px] text-slate-400 font-normal truncate mt-0.5">
                          {opt.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {opt.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-pill bg-slate-200/60 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-800">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper text or error */}
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
}
