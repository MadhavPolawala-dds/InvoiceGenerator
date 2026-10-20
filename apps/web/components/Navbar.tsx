'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Plus, Sparkles, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/Button';

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-4 z-40 px-4 sm:px-6 max-w-6xl mx-auto w-full mb-8">
      <nav
        aria-label="Main Navigation"
        className="glass-pill px-4 sm:px-6 py-2.5 flex items-center justify-between border border-white/90 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_10px_30px_-5px_rgba(15,23,42,0.08),0_2px_8px_-2px_rgba(15,23,42,0.04)]"
      >
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-pill px-1.5 py-0.5 group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-[0_2px_10px_rgba(37,99,235,0.4)] transition-transform duration-200 group-hover:scale-105">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-extrabold text-sm sm:text-base tracking-tight text-slate-900 leading-none">
                Invoice <span className="text-blue-600 font-black">Generator</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium leading-tight">
              Financial Precision & Billing
            </span>
          </div>
        </Link>

        {/* Navigation links & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className={`px-3.5 py-1.5 rounded-pill text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              pathname === '/'
                ? 'bg-slate-200/60 text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Invoices</span>
            </span>
          </Link>

          <Link href="/invoices/new">
            <Button variant="pill-primary" size="sm" className="shadow-md">
              <Plus className="w-3.5 h-3.5" />
              <span className="font-semibold">New Invoice</span>
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
