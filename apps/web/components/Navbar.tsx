'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Plus, Sparkles, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/Button';

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-4 z-40 px-4 sm:px-6 max-w-6xl mx-auto w-full mb-6">
      <nav
        aria-label="Main Navigation"
        className="glass-pill px-4 sm:px-6 py-2.5 flex items-center justify-between border border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_30px_rgba(31,38,80,0.08)]"
      >
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-pill px-1.5 py-0.5"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.35)]">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-sm sm:text-base tracking-tight text-slate-900 leading-none">
              Aura<span className="text-blue-600 font-black">Invoice</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium leading-tight">
              Liquid Glass Financial
            </span>
          </div>
        </Link>

        {/* Navigation links & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              pathname === '/'
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Invoices</span>
            </span>
          </Link>

          <Link
            href="/design"
            className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              pathname === '/design'
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Design System</span>
            </span>
          </Link>

          <Link href="/invoices/new">
            <Button variant="pill-primary" size="sm" className="shadow-md">
              <Plus className="w-3.5 h-3.5" />
              <span>New Invoice</span>
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
