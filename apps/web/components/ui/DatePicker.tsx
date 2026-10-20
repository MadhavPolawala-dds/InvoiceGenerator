'use client';

import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DatePickerProps {
  label?: string;
  value?: string; // YYYY-MM-DD
  onChange?: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
  className?: string;
  minDate?: string;
  maxDate?: string;
  align?: 'left' | 'right';
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseISODate(isoStr?: string): Date | null {
  if (!isoStr) return null;
  const parts = isoStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
}

function formatToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(isoStr?: string): string {
  const d = parseISODate(isoStr);
  if (!d) return '';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DatePicker({
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  required,
  disabled,
  placeholder = 'Select date...',
  id: customId,
  name,
  className,
  minDate,
  maxDate,
  align = 'left',
}: DatePickerProps) {
  const generatedId = useId();
  const id = customId || generatedId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Current viewed month & year in calendar
  const initialDate = parseISODate(value) || new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  // Update viewed month if incoming value changes
  useEffect(() => {
    if (value) {
      const d = parseISODate(value);
      if (d) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

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

  // Handle Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        onBlur?.();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onBlur]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const selectedDate = new Date(viewYear, viewMonth, day);
    const iso = formatToISO(selectedDate);
    onChange?.(iso);
    setIsOpen(false);
    onBlur?.();
  };

  const handlePresetSelect = (daysOffset: number) => {
    const base = new Date();
    base.setDate(base.getDate() + daysOffset);
    const iso = formatToISO(base);
    onChange?.(iso);
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setIsOpen(false);
    onBlur?.();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('');
    onBlur?.();
  };

  // Calendar matrix calculation
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: {
      day: number;
      isCurrentMonth: boolean;
      iso: string;
      isToday: boolean;
      isSelected: boolean;
      isDisabled: boolean;
    }[] = [];

    const todayIso = formatToISO(new Date());

    // Previous month overflow days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(viewYear, viewMonth - 1, dayNum);
      const iso = formatToISO(prevDate);
      cells.push({
        day: dayNum,
        isCurrentMonth: false,
        iso,
        isToday: iso === todayIso,
        isSelected: iso === value,
        isDisabled: Boolean(
          (minDate && iso < minDate) || (maxDate && iso > maxDate),
        ),
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const curDate = new Date(viewYear, viewMonth, dayNum);
      const iso = formatToISO(curDate);
      cells.push({
        day: dayNum,
        isCurrentMonth: true,
        iso,
        isToday: iso === todayIso,
        isSelected: iso === value,
        isDisabled: Boolean(
          (minDate && iso < minDate) || (maxDate && iso > maxDate),
        ),
      });
    }

    // Next month overflow days (fill grid up to multiple of 7)
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let dayNum = 1; dayNum <= remaining; dayNum++) {
        const nextDate = new Date(viewYear, viewMonth + 1, dayNum);
        const iso = formatToISO(nextDate);
        cells.push({
          day: dayNum,
          isCurrentMonth: false,
          iso,
          isToday: iso === todayIso,
          isSelected: iso === value,
          isDisabled: Boolean(
            (minDate && iso < minDate) || (maxDate && iso > maxDate),
          ),
        });
      }
    }

    return cells;
  }, [viewYear, viewMonth, value, minDate, maxDate]);

  const displayString = formatDisplayDate(value);

  return (
    <div
      ref={containerRef}
      className={cn('w-full flex flex-col gap-1.5 relative', isOpen && 'z-50')}
    >
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-slate-700 tracking-tight flex items-center justify-between select-none"
        >
          <span className="flex items-center gap-1">
            {label}
            {required && (
              <span className="text-red-500 font-bold" aria-hidden="true">
                *
              </span>
            )}
          </span>
          {value && (
            <span className="text-[10px] font-mono text-slate-400 font-normal">
              {value}
            </span>
          )}
        </label>
      )}

      {/* Input Trigger */}
      <div className="relative">
        <button
          type="button"
          id={id}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
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
          <span
            className={cn(
              'truncate font-medium',
              displayString ? 'text-slate-900' : 'text-slate-400 font-normal',
            )}
          >
            {displayString || placeholder}
          </span>

          <div className="flex items-center gap-1.5 ml-2">
            {value && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                aria-label="Clear date"
                className="w-5 h-5 rounded-full hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </span>
            )}
            <div
              className={cn(
                'w-6 h-6 rounded-lg flex items-center justify-center transition-colors',
                isOpen
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-blue-600',
              )}
            >
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>
        </button>

        {/* Hidden native input for form compatibility */}
        <input
          type="hidden"
          name={name}
          value={value || ''}
          required={required}
        />
      </div>

      {/* Floating Frosted Glass Calendar Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="dialog"
            aria-label="Calendar date picker"
            className={cn(
              'absolute top-[calc(100%+6px)] z-[9999] w-[310px] sm:w-[330px] p-4 rounded-2xl bg-white/95 border border-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.18),0_0_0_1px_rgba(0,0,0,0.04)] backdrop-blur-2xl',
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            {/* Header: Month / Year Navigation */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200/50">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="w-8 h-8 rounded-pill flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white/80 border border-transparent hover:border-slate-200 transition-all shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-center">
                <span className="text-sm font-extrabold font-heading text-slate-900 tracking-tight">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="w-8 h-8 rounded-pill flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white/80 border border-transparent hover:border-slate-200 transition-all shadow-xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Invoice Terms Presets */}
            <div className="grid grid-cols-4 gap-1.5 mb-3 p-1 rounded-xl bg-slate-100/70 border border-slate-200/60">
              <button
                type="button"
                onClick={() => handlePresetSelect(0)}
                className="py-1 px-1.5 text-[10px] font-bold rounded-lg text-slate-700 hover:text-blue-700 hover:bg-white transition-all text-center"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect(15)}
                className="py-1 px-1.5 text-[10px] font-bold rounded-lg text-slate-700 hover:text-blue-700 hover:bg-white transition-all text-center"
              >
                +15 Days
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect(30)}
                className="py-1 px-1.5 text-[10px] font-bold rounded-lg text-slate-700 hover:text-blue-700 hover:bg-white transition-all text-center"
              >
                +30 Days
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect(60)}
                className="py-1 px-1.5 text-[10px] font-bold rounded-lg text-slate-700 hover:text-blue-700 hover:bg-white transition-all text-center"
              >
                +60 Days
              </button>
            </div>

            {/* Day of Week Labels */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {DAY_NAMES.map((name) => (
                <div
                  key={name}
                  className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-1"
                >
                  {name}
                </div>
              ))}
            </div>

            {/* Day Cells Matrix */}
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((cell, idx) => {
                return (
                  <button
                    key={`${cell.iso}-${idx}`}
                    type="button"
                    disabled={cell.isDisabled}
                    onClick={() => {
                      if (!cell.isDisabled) {
                        onChange?.(cell.iso);
                        setIsOpen(false);
                        onBlur?.();
                      }
                    }}
                    className={cn(
                      'relative h-9 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center',
                      cell.isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-300 font-normal',
                      cell.isDisabled && 'opacity-30 cursor-not-allowed',
                      !cell.isSelected &&
                        !cell.isDisabled &&
                        'hover:bg-blue-50/80 hover:text-blue-700',
                      cell.isSelected &&
                        'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black shadow-md shadow-blue-500/35 scale-[1.04] z-10',
                      cell.isToday &&
                        !cell.isSelected &&
                        'border border-blue-400/80 text-blue-700 font-bold bg-blue-50/40',
                    )}
                  >
                    <span>{cell.day}</span>
                    {cell.isToday && !cell.isSelected && (
                      <span className="w-1 h-1 rounded-full bg-blue-600 -mt-0.5"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer: Quick Actions */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/50 text-xs">
              <button
                type="button"
                onClick={() => {
                  onChange?.('');
                  setIsOpen(false);
                  onBlur?.();
                }}
                className="text-slate-500 hover:text-slate-900 font-medium px-2 py-1 rounded-lg hover:bg-slate-100/60 transition-colors"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => {
                  handlePresetSelect(0);
                }}
                className="text-blue-700 font-bold px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Today
              </button>
            </div>
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
