'use client';

import React from 'react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Trash2, AlertTriangle } from 'lucide-react';

export interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string;
  customerName?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  invoiceNumber,
  customerName,
  onConfirm,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Invoice"
      description="Permanent removal confirmation"
    >
      <div className="space-y-5 pt-1">
        {/* Warning Icon Badge */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-red-50/80 border border-red-200/70 text-red-950">
          <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-300/80 text-red-600 flex items-center justify-center shrink-0 shadow-inner">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Permanently delete invoice #{invoiceNumber}?
            </h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              {customerName ? (
                <>
                  This will remove the record for <strong className="text-slate-900">{customerName}</strong> from your database.
                </>
              ) : (
                'This will remove all associated line items and email delivery logs.'
              )}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-500 px-1">
          This action cannot be undone. Any payment tracking or references associated with invoice{' '}
          <strong className="text-slate-700">#{invoiceNumber}</strong> will be erased.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/60">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
            className="shadow-md"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            <span>Delete Invoice</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
