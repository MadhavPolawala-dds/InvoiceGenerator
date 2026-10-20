'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'danger' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'success', title, message, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Viewport Container fixed at bottom right */}
      <div
        aria-live="polite"
        className="fixed bottom-6 right-6 z-[100000] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="pointer-events-auto w-full p-4 rounded-2xl bg-white/95 border border-white/95 shadow-[0_20px_50px_rgba(15,23,42,0.22),0_0_0_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl flex items-start gap-3.5"
              >
                {/* Icon Badge */}
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border',
                    toast.type === 'danger' && 'bg-red-500/10 text-red-600 border-red-200/60',
                    toast.type === 'success' && 'bg-emerald-500/10 text-emerald-600 border-emerald-200/60',
                    toast.type === 'warning' && 'bg-amber-500/10 text-amber-600 border-amber-200/60',
                    toast.type === 'info' && 'bg-blue-500/10 text-blue-600 border-blue-200/60',
                  )}
                >
                  {toast.type === 'danger' && <Trash2 className="w-4 h-4" />}
                  {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                  {toast.type === 'warning' && <AlertCircle className="w-4 h-4" />}
                  {toast.type === 'info' && <Info className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    {toast.title}
                  </h4>
                  {toast.message && (
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {toast.message}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  aria-label="Close notification"
                  className="w-6 h-6 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
