'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { api } from '@/lib/api';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

export interface SendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceNumber: string;
  defaultEmail?: string;
  onSuccess?: () => void;
}

export function SendDialog({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
  defaultEmail = '',
  onSuccess,
}: SendDialogProps) {
  const [toEmail, setToEmail] = useState(defaultEmail);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setToEmail(defaultEmail || '');
      setMessage('');
      setError(null);
      setIsSuccess(false);
    }
  }, [open, defaultEmail]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!toEmail || !toEmail.includes('@')) {
      setError('Enter a valid email.');
      return;
    }

    setIsLoading(true);

    try {
      await api.sendInvoice(invoiceId, {
        toEmail: toEmail.trim(),
        message: message.trim() || undefined,
      });

      setIsSuccess(true);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to send invoice. Please check email provider configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Send Invoice #${invoiceNumber}`}
      description="Deliver this invoice directly to your client via email."
    >
      {isSuccess ? (
        <div className="py-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Invoice Delivered!</h3>
          <p className="text-xs text-slate-500">
            A copy has been sent to <strong>{toEmail}</strong> and logged in history.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-4">
          <Input
            label="Recipient Email"
            type="email"
            required
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            placeholder="client@example.com"
            error={error ? error : undefined}
            disabled={isLoading}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="send-message" className="text-xs font-semibold text-slate-700">
              Personal Message (Optional)
            </label>
            <textarea
              id="send-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Thank you for your business. Please remit payment by the due date."
              disabled={isLoading}
              className="w-full min-h-[45px] p-3 text-xs rounded-input bg-white/80 border border-white/90 text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 focus:shadow-[0_2px_12px_rgba(37,99,235,0.08)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/60">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              <Send className="w-4 h-4 mr-1.5" />
              <span>Send Invoice</span>
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
