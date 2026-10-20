'use client';

import React, { useMemo } from 'react';
import { calculateInvoice, formatCurrency, milliToQuantity, basisPointsToPercent } from '@invoice/invoice-core';
import { Badge } from './ui/Badge';
import { FileText, Building2, User, Calendar, CreditCard } from 'lucide-react';

export interface DocumentLineItem {
  id?: string;
  description: string;
  quantityMilli: number;
  unitPriceCents: number;
}

export interface DocumentCustomField {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  position: number;
}

export interface InvoiceDocumentProps {
  number: string;
  status?: 'DRAFT' | 'SENT';
  issueDate: string;
  dueDate: string;
  businessName: string;
  businessEmail?: string;
  businessAddress?: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  notes?: string;
  discountCents: number;
  taxRateBp: number;
  lineItems: DocumentLineItem[];
  customFields?: DocumentCustomField[];
  className?: string;
}

export function InvoiceDocument({
  number,
  status = 'DRAFT',
  issueDate,
  dueDate,
  businessName,
  businessEmail,
  businessAddress,
  customerName,
  customerEmail,
  customerAddress,
  notes,
  discountCents,
  taxRateBp,
  lineItems,
  customFields = [],
  className = '',
}: InvoiceDocumentProps) {
  // Memoized calculation using pure domain core
  const calculation = useMemo(() => {
    try {
      return calculateInvoice({
        lines: lineItems.map((l) => ({
          quantityMilli: l.quantityMilli,
          unitPriceCents: l.unitPriceCents,
        })),
        discountCents,
        taxRateBp,
      });
    } catch {
      // In case of transient validation error while typing discount > subtotal
      return null;
    }
  }, [lineItems, discountCents, taxRateBp]);

  // CRITICAL SPEC RULE: Filter only visible custom fields
  // Hidden custom fields are ABSENT from the DOM of preview, print, and email
  const visibleCustomFields = useMemo(() => {
    return customFields.filter((f) => f.visible === true && f.label?.trim().length > 0);
  }, [customFields]);

  return (
    <article
      aria-label={`Invoice Document ${number || 'Draft'}`}
      className={`invoice-document bg-white text-slate-900 rounded-[24px] p-6 sm:p-10 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.10),0_0_1px_1px_rgba(0,0,0,0.04)] border border-slate-200/90 max-w-3xl mx-auto relative ${className}`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-100">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center font-bold text-lg shadow-[0_4px_12px_rgba(15,23,42,0.15)] ring-1 ring-white/20">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl tracking-tight text-slate-900 leading-tight">
                {businessName || 'Business Name'}
              </h1>
              <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Official Tax Invoice</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            {businessEmail && (
              <p className="font-medium text-slate-700 flex items-center gap-1.5">
                <span>{businessEmail}</span>
              </p>
            )}
            {businessAddress && (
              <p className="whitespace-pre-line text-slate-500 max-w-xs leading-relaxed">{businessAddress}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:items-end text-left sm:text-right shrink-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">INVOICE</span>
            <Badge variant={status === 'SENT' ? 'sent' : 'draft'} className="px-2.5 py-0.5 text-[11px]">
              {status === 'SENT' ? 'Delivered' : 'Draft'}
            </Badge>
          </div>

          <p className="font-mono font-black text-xl sm:text-2xl text-slate-900 tracking-tight whitespace-nowrap">
            #{number || 'INV-0000'}
          </p>

          <div className="mt-3.5 flex flex-col gap-1 text-xs">
            <div className="inline-flex items-center sm:justify-end gap-2 bg-slate-50 px-2.5 py-1 rounded-pill border border-slate-200/60">
              <span className="text-slate-400 font-medium">Issued:</span>
              <span className="font-semibold text-slate-800">{issueDate || '—'}</span>
            </div>
            <div className="inline-flex items-center sm:justify-end gap-2 bg-blue-50/60 px-2.5 py-1 rounded-pill border border-blue-200/50">
              <span className="text-blue-600 font-medium">Due Date:</span>
              <span className="font-bold text-blue-700">{dueDate || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To & Metadata Grid */}
      <div className="py-6 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>Billed To</span>
          </div>
          <p className="font-bold text-base text-slate-900">{customerName || 'Customer Name'}</p>
          {customerEmail && <p className="text-xs text-blue-600 font-medium mt-0.5">{customerEmail}</p>}
          {customerAddress && (
            <p className="text-xs text-slate-500 mt-1 whitespace-pre-line leading-relaxed">
              {customerAddress}
            </p>
          )}
        </div>

        {visibleCustomFields.length > 0 && (
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Invoice References
            </span>
            <div className="space-y-1.5 text-xs">
              {visibleCustomFields.map((cf) => (
                <div key={cf.id} className="flex justify-between items-center gap-2 border-b border-slate-200/50 pb-1 last:border-0 last:pb-0">
                  <span className="text-slate-500 font-medium">{cf.label}</span>
                  <span className="font-semibold text-slate-900 font-mono">{cf.value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Line Items Table */}
      <div className="py-5 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 bg-slate-50/80 rounded-t-xl">
              <th scope="col" className="py-3 px-3 text-[11px] font-bold uppercase tracking-wider rounded-l-xl">
                Description
              </th>
              <th
                scope="col"
                className="py-3 px-3 text-[11px] font-bold uppercase tracking-wider text-center w-20"
              >
                Qty
              </th>
              <th
                scope="col"
                className="py-3 px-3 text-[11px] font-bold uppercase tracking-wider text-right w-28"
              >
                Rate
              </th>
              <th
                scope="col"
                className="py-3 px-3 text-[11px] font-bold uppercase tracking-wider text-right w-28 rounded-r-xl"
              >
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lineItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-slate-400 italic">
                  No line items added yet.
                </td>
              </tr>
            ) : (
              lineItems.map((item, index) => {
                const lineTotal = calculation?.lineTotalsCents[index] ?? 0;
                return (
                  <tr key={item.id || index} className="break-inside-avoid hover:bg-slate-50/40 transition-colors">
                    <td className="py-3.5 px-3 text-sm text-slate-800 font-medium">
                      {item.description || <span className="text-slate-400 italic">No description</span>}
                    </td>
                    <td className="py-3.5 px-3 text-sm text-slate-600 text-center tabular-nums">
                      {milliToQuantity(item.quantityMilli)}
                    </td>
                    <td className="py-3.5 px-3 text-sm text-slate-600 text-right tabular-nums">
                      {formatCurrency(item.unitPriceCents)}
                    </td>
                    <td className="py-3.5 px-3 text-sm font-bold text-slate-900 text-right tabular-nums">
                      {formatCurrency(lineTotal)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Totals Summary */}
      <div className="pt-4 pb-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start gap-6">
        {/* Notes / Terms */}
        <div className="w-full sm:max-w-sm text-xs text-slate-600">
          {notes ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
              <span className="font-bold text-slate-800 block mb-1">Payment Instructions & Notes:</span>
              <p className="whitespace-pre-line text-slate-600 leading-relaxed">{notes}</p>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400">
              Standard Net 30 payment terms apply. Direct wire and bank ACH accepted.
            </div>
          )}
        </div>

        {/* Totals Breakdown Card */}
        <div className="w-full sm:w-72 space-y-2 text-xs">
          <div className="flex justify-between py-1 px-1 text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {formatCurrency(calculation?.subtotalCents ?? 0)}
            </span>
          </div>

          {(discountCents > 0 || (calculation && calculation.discountCents > 0)) && (
            <div className="flex justify-between py-1 px-1 text-slate-600">
              <span className="text-emerald-700 font-medium">Discount Applied:</span>
              <span className="font-bold text-emerald-600 tabular-nums">
                -{formatCurrency(discountCents)}
              </span>
            </div>
          )}

          {taxRateBp > 0 && (
            <div className="flex justify-between py-1 px-1 text-slate-600">
              <span>Estimated Tax ({basisPointsToPercent(taxRateBp)}%):</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {formatCurrency(calculation?.taxCents ?? 0)}
              </span>
            </div>
          )}

          {/* Grand Total Banner */}
          <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex justify-between items-baseline shadow-md">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
                Total Due
              </span>
              <span className="text-[11px] text-blue-300 font-medium">USD Currency</span>
            </div>
            <span className="text-2xl font-black font-heading text-white tabular-nums tracking-tight">
              {formatCurrency(calculation?.totalCents ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>Thank you for your business. Remit payment according to terms.</span>
        <span className="font-medium text-slate-500 flex items-center gap-1">
          <CreditCard className="w-3.5 h-3.5 text-blue-500" />
          <span>Financial Precision • 100% Integer Math</span>
        </span>
      </div>
    </article>
  );
}
