'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FileText, Plus, Sparkles, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen pb-20">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10">
        <div className="glass p-8 sm:p-12 rounded-card diagonal-highlight text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill glass-pill text-xs font-semibold text-blue-700">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Liquid Glass Architecture • Active Milestone B1</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black font-heading text-slate-900 tracking-tight leading-tight">
            Next-Gen Invoicing with <br className="hidden sm:block" />
            <span className="text-blue-600">Financial Precision</span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Craft, preview, and deliver transparent invoices with exact integer math, real-time live preview, and an exquisite iOS-style liquid glass aesthetic.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/design">
              <Button variant="pill-primary" size="lg" className="shadow-lg">
                <Sparkles className="w-4 h-4 mr-1.5" />
                <span>Explore Design System</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>

            <Link href="/invoices/new">
              <Button variant="pill-secondary" size="lg">
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Create Invoice</span>
              </Button>
            </Link>
          </div>

          <div className="pt-6 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-3.5 rounded-control bg-white/50 border border-white/70">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Check className="w-3.5 h-3.5 text-blue-600" />
                <span>Integer Cents Math</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Zero floating point errors. Round half-up arithmetic.</p>
            </div>

            <div className="p-3.5 rounded-control bg-white/50 border border-white/70">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>WCAG AA Contrast</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Fallbacks for reduced transparency & motion.</p>
            </div>

            <div className="p-3.5 rounded-control bg-white/50 border border-white/70">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Badge variant="sent" className="px-1.5 py-0 text-[10px]">99.00</Badge>
                <span>Check Case Tested</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">2 x $50.00, $10.00 disc, 10% tax = $99.00.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
