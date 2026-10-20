'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { InvoiceEditor } from '@/components/InvoiceEditor';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';

export default function EditInvoicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const { data: invoice, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.getInvoice(id as string),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="glass p-12 rounded-card border border-white/80 animate-pulse text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-slate-200/80 mx-auto" />
            <div className="h-5 w-40 bg-slate-200/80 rounded-pill mx-auto" />
            <div className="h-4 w-60 bg-slate-200/60 rounded-pill mx-auto" />
          </div>
        </main>
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="min-h-screen pb-20">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="glass p-8 sm:p-12 rounded-card diagonal-highlight text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold font-heading text-slate-900">Invoice Not Found</h2>
            <p className="text-xs text-slate-500">
              {(error as any)?.message || 'Could not retrieve this invoice from the server.'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={() => router.push('/')}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back to Invoices
              </Button>
              <Button variant="primary" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <InvoiceEditor initialInvoice={invoice} />;
}
