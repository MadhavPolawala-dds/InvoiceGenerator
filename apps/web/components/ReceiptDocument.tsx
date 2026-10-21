'use client';

import React from 'react';
import { formatCurrency, milliToQuantity } from '@invoice/invoice-core';

export interface ReceiptLineItem {
  id?: string;
  description: string;
  quantityMilli: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface ReceiptCustomField {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  position: number;
}

export interface ReceiptDocumentProps {
  number: string;
  issueDate: string;
  dueDate: string;
  businessName: string;
  customerName: string;
  customerEmail?: string | null;
  notes?: string | null;
  discountCents: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  lineItems: ReceiptLineItem[];
  customFields?: ReceiptCustomField[];
  className?: string;
}

/**
 * Formats an ISO date string as `YYYY-MM-DD` without drifting across
 * timezones (the API always hands back UTC timestamps).
 */
function formatDate(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().split('T')[0];
}

/**
 * Customer-facing receipt sheet.
 *
 * Mirrors the delivered e-mail receipt (`apps/api/src/mail/templates/invoice-email.html`)
 * one-to-one: same header band, same meta grid, same items table, same totals
 * block and the same cream notes panel.
 */
export function ReceiptDocument({
  number,
  issueDate,
  dueDate,
  businessName,
  customerName,
  customerEmail,
  notes,
  discountCents,
  subtotalCents,
  taxCents,
  totalCents,
  lineItems,
  customFields = [],
  className = '',
}: ReceiptDocumentProps) {
  const visibleCustomFields = customFields.filter((field) => field.visible);
  const hasNotes = Boolean(notes && notes.trim());

  return (
    <article
      className={`receipt-document w-full max-w-[600px] mx-auto bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden print:rounded-none print:border-0 print:shadow-none ${className}`}
    >
      {/* ── Header band ─────────────────────────────────────────── */}
      <header className="receipt-header bg-gradient-to-b from-white to-slate-50 border-b border-slate-100 px-8 pt-8 pb-6">
        <h1 className="text-xl font-extrabold text-slate-900 leading-tight">{businessName}</h1>

        <span className="inline-block mt-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          Invoice {number}
        </span>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-y-4">
          <div className="text-[13px] leading-relaxed">
            <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-slate-500 mb-1">
              Billed To
            </p>
            <p className="font-semibold text-slate-800">{customerName}</p>
            {customerEmail ? (
              <p className="text-blue-600 break-words">{customerEmail}</p>
            ) : null}
          </div>

          <div className="text-[13px] leading-relaxed sm:text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-slate-500 mb-1">
              Dates
            </p>
            <p className="text-slate-700">
              Issue Date:{' '}
              <span className="font-semibold text-slate-800">{formatDate(issueDate)}</span>
            </p>
            <p className="text-slate-700">
              Due Date:{' '}
              <span className="font-semibold text-blue-600">{formatDate(dueDate)}</span>
            </p>
          </div>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="receipt-content px-8 py-6">
        {/* Line items */}
        <table className="w-full border-collapse mt-4">
          <thead>
            <tr>
              <th className="text-left bg-slate-50 border-b-2 border-slate-200 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.5px] text-slate-500">
                Description
              </th>
              <th className="text-center bg-slate-50 border-b-2 border-slate-200 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.5px] text-slate-500 w-[60px]">
                Qty
              </th>
              <th className="text-right bg-slate-50 border-b-2 border-slate-200 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.5px] text-slate-500 w-[90px]">
                Price
              </th>
              <th className="text-right bg-slate-50 border-b-2 border-slate-200 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.5px] text-slate-500 w-[90px]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {lineItems.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="text-center text-slate-400 px-3 py-3 text-[13px]"
                >
                  No line items
                </td>
              </tr>
            ) : (
              lineItems.map((item, index) => (
                <tr key={item.id ?? index}>
                  <td className="px-3 py-2.5 border-b border-slate-100 text-[13px] text-slate-800 align-top">
                    {item.description}
                  </td>
                  <td className="px-3 py-2.5 border-b border-slate-100 text-[13px] text-slate-600 text-center tabular-nums">
                    {milliToQuantity(item.quantityMilli)}
                  </td>
                  <td className="px-3 py-2.5 border-b border-slate-100 text-[13px] text-slate-600 text-right tabular-nums">
                    {formatCurrency(item.unitPriceCents)}
                  </td>
                  <td className="px-3 py-2.5 border-b border-slate-100 text-[13px] font-semibold text-slate-900 text-right tabular-nums">
                    {formatCurrency(item.lineTotalCents)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Totals */}
        <table className="w-full border-collapse mt-6">
          <tbody>
            <tr>
              <td className="py-1.5 px-3 text-right text-[13px] font-medium text-slate-500">
                Subtotal:
              </td>
              <td className="py-1.5 px-3 text-right text-[13px] font-semibold text-slate-900 tabular-nums w-[100px]">
                {formatCurrency(subtotalCents)}
              </td>
            </tr>
            <tr>
              <td className="py-1.5 px-3 text-right text-[13px] font-medium text-slate-500">
                Discount:
              </td>
              <td className="py-1.5 px-3 text-right text-[13px] font-semibold text-slate-900 tabular-nums">
                -{formatCurrency(discountCents)}
              </td>
            </tr>
            <tr>
              <td className="py-1.5 px-3 text-right text-[13px] font-medium text-slate-500">
                Tax:
              </td>
              <td className="py-1.5 px-3 text-right text-[13px] font-semibold text-slate-900 tabular-nums">
                {formatCurrency(taxCents)}
              </td>
            </tr>
            <tr className="border-t-2 border-slate-200">
              <td className="pt-3 px-3 text-right text-base font-extrabold text-slate-900">
                Amount Due:
              </td>
              <td className="pt-3 px-3 text-right text-lg font-extrabold text-blue-600 tabular-nums">
                {formatCurrency(totalCents)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Additional information (visible custom fields only) */}
        {visibleCustomFields.length > 0 ? (
          <div className="mt-5 rounded-[10px] border border-slate-200 bg-slate-50 px-4 py-3.5 text-[12px]">
            <p className="mb-2 text-[11px] font-bold uppercase text-slate-500">
              Additional Information
            </p>
            {visibleCustomFields.map((field) => (
              <div key={field.id} className="mb-1.5 last:mb-0">
                <span className="font-bold text-slate-600">{field.label}:</span>
                <span className="ml-1.5 text-slate-900">{field.value}</span>
              </div>
            ))}
          </div>
        ) : null}

        {/* Notes & payment terms */}
        {hasNotes ? (
          <div className="mt-5 rounded-[10px] border border-amber-100 bg-amber-50 px-4 py-3.5 text-[12px] leading-relaxed text-amber-800">
            <p className="font-bold">Notes &amp; Payment Terms:</p>
            <p className="mt-1 whitespace-pre-line">{notes}</p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
