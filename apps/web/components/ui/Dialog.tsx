'use client';

import React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  trigger?: React.ReactNode;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  trigger,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            {/* Blurred Backdrop */}
            <RadixDialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md"
              />
            </RadixDialog.Overlay>

            {/* Glass Dialog Panel */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <RadixDialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 8 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  className={cn(
                    'w-full max-w-lg p-6 sm:p-7 rounded-card',
                    'glass-strong border border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_20px_50px_rgba(15,23,42,0.18)]',
                    'focus:outline-none diagonal-highlight relative',
                  )}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <RadixDialog.Title className="text-xl font-bold font-heading text-slate-900">
                        {title}
                      </RadixDialog.Title>
                      {description && (
                        <RadixDialog.Description className="text-sm text-slate-600 mt-1">
                          {description}
                        </RadixDialog.Description>
                      )}
                    </div>
                    <RadixDialog.Close asChild>
                      <button
                        type="button"
                        aria-label="Close dialog"
                        className="p-2 rounded-control text-slate-500 hover:text-slate-900 hover:bg-black/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </RadixDialog.Close>
                  </div>

                  <div className="mt-2">{children}</div>
                </motion.div>
              </RadixDialog.Content>
            </div>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
