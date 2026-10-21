'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Printer, Receipt as ReceiptIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { ReceiptDocument } from '@/components/ReceiptDocument';

export default function ReceiptPage() {
  const params = useParams<{ id: string }>();
  const invoiceId = typeof params?.id === 'string' ? params.id : '';

  const { data: invoice, isLoading, isError, error } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => api.getInvoice(invoiceId),
    enabled: Boolean(invoiceId),
  });

  return (
    <div className="receipt-page relative z-0 min-h-screen bg-slate-50/60 print:bg-white print:min-h-0">
      {/* Page chrome — never printed */}
      <div className="print:hidden sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[600px] items-center justify-between gap-3 px-4 py-3">
          <Link
            href={invoice ? `/invoices/${invoice.id}` : '/'}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to invoice</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <ReceiptIcon className="w-3.5 h-3.5" />
              Receipt
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / Save PDF</span>
              <span className="sm:hidden">Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Receipt sheet */}
      <main className="mx-auto w-full max-w-[600px] px-0 py-0 print:py-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-sm font-medium text-slate-500">Loading receipt…</p>
          </div>
        ) : isError || !invoice ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
            <p className="text-sm font-bold text-slate-900">Receipt unavailable</p>
            <p className="text-xs text-slate-500">
              {error instanceof Error ? error.message : 'This receipt could not be loaded.'}
            </p>
            <Link
              href="/"
              className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Invoices
            </Link>
          </div>
        ) : (
          <ReceiptDocument
            number={invoice.number}
            issueDate={invoice.issueDate}
            dueDate={invoice.dueDate}
            businessName={invoice.businessName}
            customerName={invoice.customerName}
            customerEmail={invoice.customerEmail}
            notes={invoice.notes}
            discountCents={invoice.discountCents}
            subtotalCents={invoice.subtotalCents}
            taxCents={invoice.taxCents}
            totalCents={invoice.totalCents}
            lineItems={invoice.lineItems}
            customFields={invoice.customFields}
          />
        )}
      </main>
    </div>
  );
}
