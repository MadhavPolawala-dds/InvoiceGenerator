'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiInvoice } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SendDialog } from '@/components/SendDialog';
import { formatCurrency } from '@invoice/invoice-core';
import {
  Plus,
  Send,
  Edit3,
  Trash2,
  Printer,
  Sparkles,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { CountUpNumber } from '@/components/ui/CountUpNumber';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';

export default function InvoicesListPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'ALL' | 'DRAFT' | 'SENT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('NEWEST');
  const [sendDialogInvoice, setSendDialogInvoice] = useState<ApiInvoice | null>(null);
  const [deleteTargetInvoice, setDeleteTargetInvoice] = useState<ApiInvoice | null>(null);

  const { data: invoices, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['invoices'],
    queryFn: api.getInvoices,
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteInvoice,
    onSuccess: () => {
      const deletedNum = deleteTargetInvoice?.number || 'Invoice';
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setDeleteTargetInvoice(null);
      showToast({
        type: 'success',
        title: 'Invoice Deleted',
        message: `Invoice #${deletedNum} has been permanently deleted.`,
      });
    },
    onError: (err: any) => {
      showToast({
        type: 'danger',
        title: 'Delete Failed',
        message: err.message || 'Could not delete invoice. Please try again.',
      });
    },
  });

  const handleDeleteClick = (inv: ApiInvoice) => {
    setDeleteTargetInvoice(inv);
  };

  // Filtered & sorted invoices
  const filteredInvoices = (invoices || [])
    .filter((inv) => {
      if (filter !== 'ALL' && inv.status !== filter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          inv.number.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          inv.businessName.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'NEWEST') {
        const timeB = new Date(b.createdAt || b.issueDate).getTime();
        const timeA = new Date(a.createdAt || a.issueDate).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return b.number.localeCompare(a.number);
      }
      if (sortBy === 'OLDEST') {
        const timeA = new Date(a.createdAt || a.issueDate).getTime();
        const timeB = new Date(b.createdAt || b.issueDate).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return a.number.localeCompare(b.number);
      }
      if (sortBy === 'DUE_ASC') {
        const dueA = new Date(a.dueDate).getTime();
        const dueB = new Date(b.dueDate).getTime();
        if (dueA !== dueB) return dueA - dueB;
        return a.number.localeCompare(b.number);
      }
      if (sortBy === 'DUE_DESC') {
        const dueA = new Date(a.dueDate).getTime();
        const dueB = new Date(b.dueDate).getTime();
        if (dueA !== dueB) return dueB - dueA;
        return b.number.localeCompare(a.number);
      }
      if (sortBy === 'AMOUNT_DESC') {
        return b.totalCents - a.totalCents;
      }
      if (sortBy === 'AMOUNT_ASC') {
        return a.totalCents - b.totalCents;
      }
      if (sortBy === 'CUSTOMER') {
        return a.customerName.localeCompare(b.customerName);
      }
      return 0;
    });

  // Calculate summary stats
  const totalRevenueCents = (invoices || []).reduce((acc, curr) => acc + curr.totalCents, 0);
  const sentCount = (invoices || []).filter((i) => i.status === 'SENT').length;
  const draftCount = (invoices || []).filter((i) => i.status === 'DRAFT').length;

  return (
    <div className="min-h-screen pb-20">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header Stats Bar */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill glass-pill text-xs font-semibold text-blue-700 mb-2 border border-white/80 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Financial Command Center</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 tracking-tight">
                Invoices
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Manage, preview, and deliver invoices with zero floating-point arithmetic errors.
              </p>
            </div>

            <Link href="/invoices/new">
              <Button variant="pill-primary" size="md" className="shadow-lg hover:shadow-xl">
                <Plus className="w-4 h-4 mr-1.5" />
                <span className="font-semibold">Create New Invoice</span>
              </Button>
            </Link>
          </div>

          {/* Metric Glass Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 rounded-card diagonal-highlight flex items-center justify-between border border-white/90">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Volume
                </span>
                <div className="mt-1">
                  <CountUpNumber
                    valueCents={totalRevenueCents}
                    className="text-2xl sm:text-3xl font-black font-heading text-slate-900"
                  />
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Across {invoices?.length || 0} total invoices
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500/10 to-indigo-500/20 border border-blue-400/30 text-blue-600 flex items-center justify-center shadow-sm">
                <Receipt className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-card diagonal-highlight flex items-center justify-between border border-white/90">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Confirmed Deliveries
                </span>
                <p className="text-2xl sm:text-3xl font-black font-heading text-emerald-600 tabular-nums mt-1">
                  {sentCount}
                </p>
                <span className="text-[11px] text-emerald-700/80 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Email dispatched
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/20 border border-emerald-400/30 text-emerald-600 flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-card diagonal-highlight flex items-center justify-between border border-white/90">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Draft Invoices
                </span>
                <p className="text-2xl sm:text-3xl font-black font-heading text-amber-600 tabular-nums mt-1">
                  {draftCount}
                </p>
                <span className="text-[11px] text-slate-500 font-medium">
                  Ready to review & send
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/10 to-orange-500/20 border border-amber-400/30 text-amber-600 flex items-center justify-center shadow-sm">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <div className="glass-pill p-2 sm:p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 border border-white/90 shadow-sm relative z-30">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by invoice #, client, or business..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-8 text-xs rounded-pill bg-white/70 border border-white/80 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="w-full sm:w-48 shrink-0 relative z-40">
            <Select
              value={sortBy}
              onChange={setSortBy}
              align="right"
              options={[
                { value: 'NEWEST', label: 'Newest First' },
                { value: 'OLDEST', label: 'Oldest First' },
                { value: 'DUE_ASC', label: 'Due Date (Soonest)' },
                { value: 'DUE_DESC', label: 'Due Date (Latest)' },
                { value: 'AMOUNT_DESC', label: 'Highest Amount' },
                { value: 'AMOUNT_ASC', label: 'Lowest Amount' },
                { value: 'CUSTOMER', label: 'Customer A-Z' },
              ]}
            />
          </div>

          <div className="flex items-center gap-1.5 self-center sm:self-auto bg-slate-200/60 p-1 rounded-pill">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-pill transition-all ${
                filter === 'ALL'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({(invoices || []).length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('DRAFT')}
              className={`px-3 py-1 text-xs font-semibold rounded-pill transition-all ${
                filter === 'DRAFT'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Draft ({draftCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('SENT')}
              className={`px-3 py-1 text-xs font-semibold rounded-pill transition-all ${
                filter === 'SENT'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sent ({sentCount})
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative z-0">
          {isLoading ? (
          // Loading Skeleton
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="glass p-6 rounded-card border border-white/80 animate-pulse flex items-center justify-between"
              >
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-200/80 rounded-pill" />
                  <div className="h-5 w-48 bg-slate-200/60 rounded-input" />
                  <div className="h-3 w-24 bg-slate-200/50 rounded-pill" />
                </div>
                <div className="h-8 w-24 bg-slate-200/80 rounded-pill" />
              </div>
            ))}
          </div>
        ) : isError ? (
          // Error State with Retry
          <div className="glass p-8 rounded-card diagonal-highlight text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Failed to load invoices</h2>
            <p className="text-xs text-slate-500">
              {(error as any)?.message || 'Could not connect to the API server.'}
            </p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Retry
            </Button>
          </div>
        ) : filteredInvoices.length === 0 ? (
          // Empty State
          <div className="glass p-12 rounded-card diagonal-highlight text-center space-y-5 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25">
              <Receipt className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-900">
                {searchQuery || filter !== 'ALL' ? 'No matching invoices found' : 'No invoices created yet'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {searchQuery || filter !== 'ALL'
                  ? 'Try adjusting your search query or filter options above.'
                  : 'Get started by creating your very first customized invoice with financial precision.'}
              </p>
            </div>
            {searchQuery || filter !== 'ALL' ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilter('ALL');
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Link href="/invoices/new">
                <Button variant="pill-primary" size="md">
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>Create First Invoice</span>
                </Button>
              </Link>
            )}
          </div>
        ) : (
          // Invoices Grid
          <div className="grid grid-cols-1 gap-3.5">
            {filteredInvoices.map((inv) => {
              const initials = (inv.customerName || 'Cust')
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div
                  key={inv.id}
                  className="glass-card p-5 rounded-[22px] diagonal-highlight border border-white/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  {/* Left: Metadata & Client */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-300/60 text-slate-700 font-bold text-xs flex items-center justify-center shadow-inner shrink-0 mt-0.5">
                      {initials}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-slate-900 bg-white/80 px-2 py-0.5 rounded-pill border border-slate-200/80">
                          #{inv.number}
                        </span>
                        <Badge variant={inv.status === 'SENT' ? 'sent' : 'draft'} className="px-2 py-0.5 text-[10px]">
                          {inv.status === 'SENT' ? (
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Delivered
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Draft
                            </span>
                          )}
                        </Badge>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Issued: {new Date(inv.issueDate).toISOString().split('T')[0]} • Due: {new Date(inv.dueDate).toISOString().split('T')[0]}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-slate-800">
                        {inv.customerName}
                        <span className="text-xs font-normal text-slate-500 ml-2">
                          ({inv.businessName})
                        </span>
                      </p>

                      <p className="text-[11px] text-slate-500">
                        {inv.lineItems?.length || 0} line {inv.lineItems?.length === 1 ? 'item' : 'items'}
                        {inv.customFields?.length > 0 && ` • ${inv.customFields.length} custom attributes`}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Amount Due
                      </span>
                      <span className="font-heading font-black text-xl text-slate-900 tabular-nums">
                        {formatCurrency(inv.totalCents)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link href={`/invoices/${inv.id}`}>
                        <Button variant="secondary" size="sm" aria-label={`Edit invoice #${inv.number}`}>
                          <Edit3 className="w-3.5 h-3.5 mr-1" />
                          <span>View & Edit</span>
                        </Button>
                      </Link>

                      <Link
                        href={`/receipt/${inv.id}`}
                        target="_blank"
                        rel="noreferrer"
                        title={`Open receipt for invoice #${inv.number}`}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Open receipt for invoice #${inv.number}`}
                          className="text-slate-400 hover:text-blue-600 hover:bg-blue-50/70"
                        >
                          <Receipt className="w-4 h-4" />
                        </Button>
                      </Link>

                      <Button
                        variant="pill-primary"
                        size="sm"
                        onClick={() => setSendDialogInvoice(inv)}
                        aria-label={`Send invoice #${inv.number}`}
                      >
                        <Send className="w-3.5 h-3.5 mr-1" />
                        <span>Send</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(inv)}
                        aria-label={`Delete invoice #${inv.number}`}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50/70"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </main>

      {/* Send Dialog */}
      {sendDialogInvoice && (
        <SendDialog
          open={Boolean(sendDialogInvoice)}
          onOpenChange={(open) => {
            if (!open) setSendDialogInvoice(null);
          }}
          invoiceId={sendDialogInvoice.id}
          invoiceNumber={sendDialogInvoice.number}
          defaultEmail={sendDialogInvoice.customerEmail || ''}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetInvoice && (
        <DeleteConfirmDialog
          open={Boolean(deleteTargetInvoice)}
          onOpenChange={(open) => {
            if (!open) setDeleteTargetInvoice(null);
          }}
          invoiceNumber={deleteTargetInvoice.number}
          customerName={deleteTargetInvoice.customerName}
          onConfirm={() => {
            if (deleteTargetInvoice) {
              deleteMutation.mutate(deleteTargetInvoice.id);
            }
          }}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
