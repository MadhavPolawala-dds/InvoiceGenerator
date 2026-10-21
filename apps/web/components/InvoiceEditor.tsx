'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  calculateInvoice,
  dollarsToCents,
  centsToDollars,
  quantityToMilli,
  milliToQuantity,
  percentToBasisPoints,
  basisPointsToPercent,
  formatCurrency,
  validateDates,
} from '@invoice/invoice-core';
import { api, ApiInvoice } from '@/lib/api';
import { InvoiceDocument } from './InvoiceDocument';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { DatePicker } from './ui/DatePicker';
import { Select } from './ui/Select';
import { Switch } from './ui/Switch';
import { Badge } from './ui/Badge';
import { SegmentedControl } from './ui/SegmentedControl';
import { CountUpNumber } from './ui/CountUpNumber';
import { SendDialog } from './SendDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { useToast } from './ui/Toast';
import {
  Save,
  Send,
  Printer,
  Plus,
  Trash2,
  DollarSign,
  Percent,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Building2,
  User,
  Calendar,
  Layers,
  FileText,
  Sliders,
  Eye,
  EyeOff,
  Sparkles,
  Receipt,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Form validation schema aligned with invoice-core domain rules
const invoiceFormSchema = z.object({
  number: z.string().min(1, 'Invoice number is required.').max(40, 'Invoice number cannot exceed 40 characters.'),
  issueDate: z.string().min(1, 'Issue date is required.').regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid issue date.'),
  dueDate: z.string().min(1, 'Due date is required.').regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid due date.'),
  businessName: z.string().min(1, 'Business name is required.').max(120, 'Business name must be between 1 and 120 characters.'),
  businessEmail: z.string().email('Enter a valid email.').optional().or(z.literal('')),
  businessAddress: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required.').max(120, 'Customer name must be between 1 and 120 characters.'),
  customerEmail: z.string().email('Enter a valid email.').optional().or(z.literal('')),
  customerAddress: z.string().optional(),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters.').optional(),
  discount: z.string().refine((val) => {
    if (!val || val.trim() === '') return true;
    return /^\d+(\.\d{1,2})?$/.test(val.trim());
  }, 'Price cannot be negative and maximum 2 decimals allowed.').optional(),
  taxRate: z.string().refine((val) => {
    if (!val || val.trim() === '') return true;
    if (!/^\d+(\.\d{1,2})?$/.test(val.trim())) return false;
    const num = parseFloat(val);
    return num >= 0 && num <= 100;
  }, 'Tax rate must be between 0 and 100.').optional(),
  lineItems: z.array(
    z.object({
      description: z.string().min(1, 'Add a description.').max(200, 'Description cannot exceed 200 characters.'),
      quantity: z.string().refine((val) => {
        if (!val || !/^\d+(\.\d{1,3})?$/.test(val.trim())) return false;
        const num = parseFloat(val);
        return num > 0 && num <= 1000000;
      }, 'Quantity must be greater than 0.'),
      unitPrice: z.string().refine((val) => {
        if (!val || !/^\d+(\.\d{1,2})?$/.test(val.trim())) return false;
        const num = parseFloat(val);
        return num >= 0 && num <= 10000000;
      }, 'Price cannot be negative.'),
    })
  ),
  customFields: z.array(
    z.object({
      id: z.string(),
      label: z.string().min(1, 'Label must be between 1 and 60 characters.').max(60, 'Label cannot exceed 60 characters.'),
      value: z.string().max(300, 'Value cannot exceed 300 characters.'),
      visible: z.boolean(),
      position: z.number(),
    })
  ).max(20, 'Maximum 20 custom fields allowed.'),
}).refine((data) => {
  const dateCheck = validateDates(data.issueDate, data.dueDate);
  return !dateCheck.dueDateError;
}, {
  message: 'Due date cannot be before the issue date.',
  path: ['dueDate'],
});

export type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

export interface InvoiceEditorProps {
  initialInvoice?: ApiInvoice;
}

export function InvoiceEditor({ initialInvoice }: InvoiceEditorProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState<string>('CUSTOM');
  const [currentInvoice, setCurrentInvoice] = useState<ApiInvoice | null>(initialInvoice || null);

  const newLabelInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize today's date and due date (+30 days)
  const defaultIssueDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const defaultDueDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }, []);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: initialInvoice
      ? {
          number: initialInvoice.number,
          issueDate: new Date(initialInvoice.issueDate).toISOString().split('T')[0],
          dueDate: new Date(initialInvoice.dueDate).toISOString().split('T')[0],
          businessName: initialInvoice.businessName,
          businessEmail: initialInvoice.businessEmail || '',
          businessAddress: initialInvoice.businessAddress || '',
          customerName: initialInvoice.customerName,
          customerEmail: initialInvoice.customerEmail || '',
          customerAddress: initialInvoice.customerAddress || '',
          notes: initialInvoice.notes || '',
          discount: centsToDollars(initialInvoice.discountCents),
          taxRate: basisPointsToPercent(initialInvoice.taxRateBp),
          lineItems: initialInvoice.lineItems.map((item) => ({
            description: item.description,
            quantity: milliToQuantity(item.quantityMilli),
            unitPrice: centsToDollars(item.unitPriceCents),
          })),
          customFields: initialInvoice.customFields.map((cf) => ({
            id: cf.id,
            label: cf.label,
            value: cf.value,
            visible: cf.visible,
            position: cf.position,
          })),
        }
      : {
          number: 'INV-2026-001',
          issueDate: defaultIssueDate,
          dueDate: defaultDueDate,
          businessName: 'Apex Software Labs LLC',
          businessEmail: 'billing@apexlabs.example.com',
          businessAddress: '100 Innovation Way, Suite 400, Austin, TX 78701',
          customerName: '',
          customerEmail: '',
          customerAddress: '',
          notes: 'Payment is due within 30 days of issue date.',
          discount: '0.00',
          taxRate: '10',
          lineItems: [
            {
              description: '',
              quantity: '1',
              unitPrice: '50.00',
            },
          ],
          customFields: [],
        },
  });

  const {
    fields: lineItemFields,
    append: appendLineItem,
    remove: removeLineItem,
  } = useFieldArray({
    control,
    name: 'lineItems',
  });

  const {
    fields: customFieldsList,
    append: appendCustomField,
    remove: removeCustomField,
  } = useFieldArray({
    control,
    name: 'customFields',
  });

  const watchedValues = watch();
  const watchedLineItems = useWatch({ control, name: 'lineItems' });
  const watchedDiscount = useWatch({ control, name: 'discount' });
  const watchedTaxRate = useWatch({ control, name: 'taxRate' });

  const updateDueDateFromTerms = (term: string, issueDateStr?: string) => {
    if (!issueDateStr || term === 'CUSTOM') return;
    const parts = issueDateStr.split('-');
    if (parts.length !== 3) return;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const base = new Date(y, m, d);
    if (isNaN(base.getTime())) return;

    if (term === 'RECEIPT') {
      setValue('dueDate', issueDateStr, { shouldValidate: true, shouldDirty: true });
    } else if (term === 'NET_15') {
      base.setDate(base.getDate() + 15);
      const res = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`;
      setValue('dueDate', res, { shouldValidate: true, shouldDirty: true });
    } else if (term === 'NET_30') {
      base.setDate(base.getDate() + 30);
      const res = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`;
      setValue('dueDate', res, { shouldValidate: true, shouldDirty: true });
    } else if (term === 'NET_60') {
      base.setDate(base.getDate() + 60);
      const res = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`;
      setValue('dueDate', res, { shouldValidate: true, shouldDirty: true });
    }
  };

  const handleDeleteInvoice = async () => {
    if (!currentInvoice?.id) return;
    setIsDeleting(true);
    try {
      await api.deleteInvoice(currentInvoice.id);
      showToast({
        type: 'success',
        title: 'Invoice Deleted',
        message: `Invoice #${currentInvoice.number} has been permanently deleted.`,
      });
      router.push('/');
    } catch (err: any) {
      setServerError(err.message || 'Failed to delete invoice');
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      showToast({
        type: 'danger',
        title: 'Delete Failed',
        message: err.message || 'Failed to delete invoice.',
      });
    }
  };

  // Navigation warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Convert inputs to domain numbers
  const domainLines = useMemo(() => {
    const rawLines = watchedLineItems || watchedValues.lineItems || [];
    return rawLines.map((l) => {
      let qtyMilli = 0;
      let priceCents = 0;
      try {
        qtyMilli = quantityToMilli(l.quantity || '0');
      } catch {}
      try {
        priceCents = dollarsToCents(l.unitPrice || '0');
      } catch {}
      return {
        description: l.description || '',
        quantityMilli: qtyMilli,
        unitPriceCents: priceCents,
      };
    });
  }, [watchedLineItems, watchedValues.lineItems]);

  const discountCents = useMemo(() => {
    try {
      return dollarsToCents(watchedDiscount ?? watchedValues.discount ?? '0');
    } catch {
      return 0;
    }
  }, [watchedDiscount, watchedValues.discount]);

  const taxRateBp = useMemo(() => {
    try {
      return percentToBasisPoints(watchedTaxRate ?? watchedValues.taxRate ?? '0');
    } catch {
      return 0;
    }
  }, [watchedTaxRate, watchedValues.taxRate]);

  // Live calculation and discount-over-subtotal validation
  const { calculation, discountError } = useMemo(() => {
    let calc = null;
    let discErr = null;

    try {
      calc = calculateInvoice({
        lines: domainLines.filter((l) => l.quantityMilli > 0),
        discountCents,
        taxRateBp,
      });
    } catch (err: any) {
      if (err.message && err.message.includes('Discount cannot exceed')) {
        discErr = err.message;
        // Keep partial calculation for subtotal
        const subtotal = domainLines.reduce((acc, curr) => {
          if (curr.quantityMilli > 0 && curr.unitPriceCents >= 0) {
            return acc + Math.round((curr.quantityMilli * curr.unitPriceCents) / 1000);
          }
          return acc;
        }, 0);
        calc = {
          subtotalCents: subtotal,
          discountCents,
          taxableCents: 0,
          taxRateBp,
          taxCents: 0,
          totalCents: subtotal,
          lineTotalsCents: domainLines.map((l) =>
            Math.round((l.quantityMilli * l.unitPriceCents) / 1000)
          ),
        };
      }
    }

    return { calculation: calc, discountError: discErr };
  }, [domainLines, discountCents, taxRateBp]);

  // Form submission: save invoice
  const onSubmit = async (data: InvoiceFormData) => {
    if (discountError) {
      setServerError(discountError);
      return;
    }

    setIsSaving(true);
    setServerError(null);
    setSavedSuccessMessage(null);

    try {
      let submitDiscountCents = 0;
      try {
        submitDiscountCents = dollarsToCents(data.discount || '0');
      } catch {}

      let submitTaxRateBp = 0;
      try {
        submitTaxRateBp = percentToBasisPoints(data.taxRate || '0');
      } catch {}

      const submitLineItems = (data.lineItems || []).map((l, index) => {
        let qtyMilli = 0;
        let priceCents = 0;
        try {
          qtyMilli = quantityToMilli(l.quantity || '0');
        } catch {}
        try {
          priceCents = dollarsToCents(l.unitPrice || '0');
        } catch {}
        return {
          position: index,
          description: (l.description || '').trim(),
          quantityMilli: qtyMilli,
          unitPriceCents: priceCents,
        };
      });

      const payload = {
        number: data.number.trim(),
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        businessName: data.businessName.trim(),
        businessEmail: data.businessEmail?.trim() || undefined,
        businessAddress: data.businessAddress?.trim() || undefined,
        customerName: data.customerName.trim(),
        customerEmail: data.customerEmail?.trim() || undefined,
        customerAddress: data.customerAddress?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        discountCents: submitDiscountCents,
        taxRateBp: submitTaxRateBp,
        customFields: (data.customFields || []).map((cf, index) => ({
          id: cf.id,
          label: cf.label.trim(),
          value: cf.value.trim(),
          visible: cf.visible,
          position: cf.position ?? index,
        })),
        lineItems: submitLineItems,
      };

      let saved: ApiInvoice;
      if (currentInvoice?.id) {
        saved = await api.updateInvoice(currentInvoice.id, payload);
      } else {
        saved = await api.createInvoice(payload);
        // Route to /invoices/[id] so page reloads from API
        router.push(`/invoices/${saved.id}`);
      }

      setCurrentInvoice(saved);
      setSavedSuccessMessage(`Invoice #${saved.number} saved successfully!`);
      setTimeout(() => setSavedSuccessMessage(null), 4000);
    } catch (err: any) {
      setServerError(err.message || 'Failed to save invoice.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper to quickly load the mandatory $99 check case (2 x $50, $10 discount, 10% tax = $99)
  const handleLoadCheckCase = () => {
    reset({
      businessName: 'Apex Software Labs LLC',
      businessEmail: 'billing@apexlabs.example.com',
      businessAddress: '100 Innovation Way, Suite 400, Austin, TX 78701',
      customerName: 'Acme Retail Solutions',
      customerEmail: 'ap@acmeretail.example.com',
      customerAddress: '500 Commerce Blvd, Seattle, WA 98101',
      number: `INV-2026-001`,
      issueDate: defaultIssueDate,
      dueDate: defaultDueDate,
      discount: '10.00',
      taxRate: '10',
      notes: 'Standard Net 30 terms. Thank you for your partnership.',
      lineItems: [
        {
          description: 'Custom API Integration & Configuration',
          quantity: '2',
          unitPrice: '50.00',
        },
      ],
      customFields: [
        {
          id: 'cf-po',
          label: 'PO Number',
          value: 'PO-77892',
          visible: true,
          position: 0,
        },
        {
          id: 'cf-internal',
          label: 'Internal Project Code',
          value: 'PRJ-ALPHA',
          visible: false,
          position: 1,
        },
      ],
    });
  };

  return (
    <div className="min-h-screen pb-32 lg:pb-20">
      {/* Top Floating Control Bar */}
      <div className="sticky top-4 z-40 px-3 sm:px-6 max-w-7xl mx-auto w-full mb-6 print:hidden">
        <header className="glass-pill px-3 sm:px-6 py-2.5 flex items-center justify-between border border-white/90 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_10px_30px_-5px_rgba(15,23,42,0.08),0_2px_8px_-2px_rgba(15,23,42,0.04)] gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="p-1.5 sm:p-2 rounded-full hover:bg-white/80 text-slate-600 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 shrink-0"
              aria-label="Back to Invoices list"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <h1 className="text-xs sm:text-sm md:text-base font-extrabold font-heading text-slate-900 leading-none truncate whitespace-nowrap" style={{ whiteSpace: 'nowrap' }}>
                  {currentInvoice ? (
                    <>
                      <span className="hidden sm:inline">Invoice </span>#{watchedValues.number}
                    </>
                  ) : (
                    'New Invoice'
                  )}
                </h1>
                {isDirty && (
                  <Badge variant="draft" className="text-[9px] sm:text-[10px] py-0.5 shrink-0">
                    Unsaved
                  </Badge>
                )}
                {currentInvoice?.status === 'SENT' && (
                  <Badge variant="sent" className="text-[9px] sm:text-[10px] py-0.5 shrink-0">
                    Sent
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-slate-500 hidden md:block truncate mt-0.5">
                Live recalculations with integer cents precision
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* View Mode Toggle on smaller screens */}
            <div className="lg:hidden shrink-0">
              <SegmentedControl
                name="editor-mode"
                options={[
                  { value: 'edit', label: 'Edit' },
                  { value: 'preview', label: 'Preview' },
                ]}
                value={activeTab}
                onChange={setActiveTab}
              />
            </div>

            {/* Quick Check Case CTA - wide screens */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleLoadCheckCase}
              title="Populate 2 × $50, $10 discount, 10% tax = $99.00"
              className="hidden xl:inline-flex text-blue-700 bg-blue-50/90 border border-blue-200 hover:bg-blue-100 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-600" />
              <span>Load $99 Check Case</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              aria-label="Print or Export PDF"
              className="hidden md:inline-flex shrink-0"
            >
              <Printer className="w-3.5 h-3.5 md:mr-1" />
              <span className="hidden md:inline">Print</span>
            </Button>

            {currentInvoice?.id && (
              <Link
                href={`/receipt/${currentInvoice.id}`}
                target="_blank"
                rel="noreferrer"
                className="hidden md:inline-flex shrink-0"
                title="Open the customer receipt page"
              >
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  aria-label="Open receipt page"
                  className="shrink-0"
                >
                  <Receipt className="w-3.5 h-3.5 md:mr-1" />
                  <span className="hidden md:inline">Receipt</span>
                </Button>
              </Link>
            )}

            {currentInvoice?.id && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-slate-400 hover:text-red-600 hover:bg-red-50/70 p-1.5 sm:p-2 shrink-0"
                aria-label={`Delete invoice #${currentInvoice.number}`}
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            )}

            {currentInvoice?.id && (
              <Button
                type="button"
                variant="pill-secondary"
                size="sm"
                onClick={() => setSendDialogOpen(true)}
                disabled={Boolean(discountError) || isDirty}
                className="px-2 sm:px-3 shrink-0"
                title="Send invoice via email"
              >
                <Send className="w-3.5 h-3.5 sm:mr-1 text-blue-600" />
                <span className="hidden sm:inline">Send</span>
              </Button>
            )}

            <Button
              type="button"
              variant="pill-primary"
              size="sm"
              onClick={handleSubmit(onSubmit)}
              isLoading={isSaving}
              disabled={Boolean(discountError)}
              className="shadow-md px-2.5 sm:px-4 shrink-0"
            >
              <Save className="w-3.5 h-3.5 sm:mr-1" />
              <span className="font-semibold text-xs sm:text-sm">
                Save<span className="hidden sm:inline"> Invoice</span>
              </span>
            </Button>
          </div>
        </header>

        {/* Aria-live announcement for saved confirmation */}
        <div aria-live="polite" className="sr-only">
          {savedSuccessMessage}
        </div>

        {/* Glass confirmation toast */}
        <AnimatePresence>
          {savedSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="mt-2 mx-auto max-w-sm glass-pill bg-emerald-50/90 border border-emerald-300 text-emerald-900 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{savedSuccessMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Server or Form-level Error Banner */}
        {serverError && (
          <div
            role="alert"
            tabIndex={-1}
            className="mt-2 mx-auto max-w-2xl p-3.5 rounded-control bg-red-50/90 border border-red-300 text-red-900 text-xs font-medium flex items-center justify-between gap-3 shadow-md"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{serverError}</span>
            </div>
            <button
              type="button"
              onClick={() => setServerError(null)}
              className="text-red-700 hover:text-red-900 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Main Container: Two-Pane on Desktop (1024px+), Segmented on Mobile */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT PANE: Editor (8 Sections) */}
          <div
            className={`lg:col-span-6 space-y-6 ${
              activeTab === 'preview' ? 'hidden lg:block' : 'block'
            }`}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* SECTION 1: BUSINESS INFO */}
              <section className="glass-card p-6 rounded-[24px] diagonal-highlight space-y-4 border border-white/90">
                <div className="flex items-center gap-3 border-b border-slate-200/50 pb-3.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-200/50 flex items-center justify-center font-bold text-xs shadow-sm">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold font-heading text-slate-900">1. Business Details</h2>
                    <p className="text-[11px] text-slate-500">Your organization issuing this invoice</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Input
                    label="Business Name"
                    required
                    {...register('businessName')}
                    error={errors.businessName?.message}
                    placeholder="Apex Software Labs LLC"
                  />
                  <Input
                    label="Business Email"
                    type="email"
                    {...register('businessEmail')}
                    error={errors.businessEmail?.message}
                    placeholder="billing@apexlabs.example.com"
                  />
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="biz-address" className="text-xs font-semibold text-slate-700">
                      Business Address
                    </label>
                    <textarea
                      id="biz-address"
                      rows={2}
                      {...register('businessAddress')}
                      placeholder="100 Innovation Way, Suite 400, Austin, TX 78701"
                      className="w-full min-h-[45px] p-3 text-xs rounded-input bg-white/80 border border-white/90 text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 focus:shadow-[0_2px_12px_rgba(37,99,235,0.08)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                    />
                  </div>
                </div>
              </section>

              {/* SECTION 2: CUSTOMER INFO */}
              <section className="glass-card p-6 rounded-[24px] diagonal-highlight space-y-4 border border-white/90">
                <div className="flex items-center gap-3 border-b border-slate-200/50 pb-3.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-200/50 flex items-center justify-center font-bold text-xs shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold font-heading text-slate-900">2. Customer Details</h2>
                    <p className="text-[11px] text-slate-500">Recipient client for billing & delivery</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Input
                    label="Customer / Company Name"
                    required
                    {...register('customerName')}
                    error={errors.customerName?.message}
                    placeholder="Acme Retail Solutions"
                  />
                  <Input
                    label="Customer Email"
                    type="email"
                    {...register('customerEmail')}
                    error={errors.customerEmail?.message}
                    placeholder="ap@acmeretail.example.com"
                    hint="Used for 1-click email delivery"
                  />
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="cust-address" className="text-xs font-semibold text-slate-700">
                      Customer Address
                    </label>
                    <textarea
                      id="cust-address"
                      rows={2}
                      {...register('customerAddress')}
                      placeholder="500 Commerce Blvd, Seattle, WA 98101"
                      className="w-full min-h-[45px] p-3 text-xs rounded-input bg-white/80 border border-white/90 text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 focus:shadow-[0_2px_12px_rgba(37,99,235,0.08)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                    />
                  </div>
                </div>
              </section>

              {/* SECTION 3: INVOICE META */}
              <section className="glass-card p-6 rounded-[24px] diagonal-highlight space-y-4 border border-white/90 relative z-30">
                <div className="flex items-center gap-3 border-b border-slate-200/50 pb-3.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 border border-sky-200/50 flex items-center justify-center font-bold text-xs shadow-sm">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold font-heading text-slate-900">3. Invoice Metadata</h2>
                    <p className="text-[11px] text-slate-500">Invoice number and payment schedule</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Input
                    label="Invoice Number"
                    required
                    {...register('number')}
                    error={errors.number?.message}
                    placeholder="INV-2026-001"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Controller
                      name="issueDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          label="Issue Date"
                          required
                          value={field.value}
                          onChange={(val) => {
                            field.onChange(val);
                            if (paymentTerms !== 'CUSTOM' && val) {
                              updateDueDateFromTerms(paymentTerms, val);
                            }
                          }}
                          onBlur={field.onBlur}
                          error={errors.issueDate?.message}
                        />
                      )}
                    />

                    <Select
                      label="Payment Terms"
                      value={paymentTerms}
                      onChange={(term) => {
                        setPaymentTerms(term);
                        updateDueDateFromTerms(term, watchedValues.issueDate);
                      }}
                      options={[
                        { value: 'CUSTOM', label: 'Custom Date', description: 'Manual selection' },
                        { value: 'RECEIPT', label: 'Due on Receipt', description: 'Due same day' },
                        { value: 'NET_15', label: 'Net 15 Days', badge: '+15d', description: 'Pay within 15 days' },
                        { value: 'NET_30', label: 'Net 30 Days', badge: '+30d', description: 'Standard (30 days)' },
                        { value: 'NET_60', label: 'Net 60 Days', badge: '+60d', description: 'Extended (60 days)' },
                      ]}
                    />

                    <Controller
                      name="dueDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          label="Due Date"
                          required
                          value={field.value}
                          onChange={(val) => {
                            field.onChange(val);
                            setPaymentTerms('CUSTOM');
                          }}
                          onBlur={field.onBlur}
                          error={errors.dueDate?.message}
                          minDate={watchedValues.issueDate}
                          align="right"
                        />
                      )}
                    />
                  </div>
                </div>
              </section>

              {/* SECTION 4: LINE ITEMS */}
              <section className="glass-card p-6 rounded-[24px] diagonal-highlight space-y-4 border border-white/90 relative z-20">
                <div className="flex items-center justify-between border-b border-slate-200/50 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 border border-violet-200/50 flex items-center justify-center font-bold text-xs shadow-sm">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold font-heading text-slate-900">4. Line Items</h2>
                      <p className="text-[11px] text-slate-500">
                        {lineItemFields.length} {lineItemFields.length === 1 ? 'item' : 'items'} added
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="pill-secondary"
                    size="sm"
                    onClick={() => appendLineItem({ description: '', quantity: '1', unitPrice: '0.00' })}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Add Item</span>
                  </Button>
                </div>

                {lineItemFields.length === 0 ? (
                  <div className="p-8 text-center rounded-[20px] bg-white/50 border border-dashed border-slate-300 space-y-2">
                    <p className="text-xs text-slate-500">No line items yet. Drafts may have zero rows.</p>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => appendLineItem({ description: 'Consulting Services', quantity: '1', unitPrice: '50.00' })}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      <span>Add First Line Item</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <AnimatePresence initial={false}>
                      {lineItemFields.map((field, index) => {
                        const lineTotal = calculation?.lineTotalsCents[index] ?? 0;
                        return (
                          <motion.div
                            key={field.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                            className="p-4 rounded-[20px] bg-white/80 border border-white/90 shadow-sm space-y-3 relative group hover:border-blue-200 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2 pb-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/70">
                                  Item #{index + 1}
                                </span>
                                <span className="text-xs font-bold text-slate-900 tabular-nums sm:hidden">
                                  {formatCurrency(lineTotal)}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeLineItem(index)}
                                aria-label={`Remove line item ${index + 1}`}
                                className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <Input
                              label="Description"
                              required
                              placeholder="e.g. Custom API Integration & Configuration"
                              {...register(`lineItems.${index}.description` as const)}
                              error={errors.lineItems?.[index]?.description?.message}
                            />

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
                              <Input
                                label="Quantity"
                                inputMode="decimal"
                                placeholder="1"
                                {...register(`lineItems.${index}.quantity` as const)}
                                error={errors.lineItems?.[index]?.quantity?.message}
                                className="tabular-nums"
                              />

                              <Input
                                label="Unit Price ($)"
                                inputMode="decimal"
                                placeholder="50.00"
                                startAdornment={<DollarSign className="w-3.5 h-3.5" />}
                                {...register(`lineItems.${index}.unitPrice` as const)}
                                error={errors.lineItems?.[index]?.unitPrice?.message}
                                className="tabular-nums"
                              />

                              <div className="hidden sm:flex flex-col gap-1.5 pb-1 text-right">
                                <span className="text-xs font-semibold text-slate-500">Line Total</span>
                                <div className="h-11 flex items-center justify-end font-bold text-sm text-slate-900 tabular-nums px-3 bg-slate-50/80 rounded-input border border-slate-200/60">
                                  {formatCurrency(lineTotal)}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </section>

              {/* SECTION 5: DISCOUNT AND TAX */}
              <section className="glass-card p-6 rounded-[24px] diagonal-highlight space-y-4 border border-white/90">
                <div className="flex items-center gap-3 border-b border-slate-200/50 pb-3.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-200/50 flex items-center justify-center font-bold text-xs shadow-sm">
                    <Percent className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold font-heading text-slate-900">5. Discount & Tax</h2>
                    <p className="text-[11px] text-slate-500">Fixed USD discount & percentage tax rate</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Discount (Fixed USD)"
                    inputMode="decimal"
                    placeholder="0.00"
                    startAdornment={<DollarSign className="w-3.5 h-3.5" />}
                    {...register('discount')}
                    error={errors.discount?.message || discountError || undefined}
                    className="tabular-nums"
                  />

                  <Input
                    label="Tax Rate (%)"
                    inputMode="decimal"
                    placeholder="10"
                    endAdornment={<Percent className="w-3.5 h-3.5" />}
                    {...register('taxRate')}
                    error={errors.taxRate?.message}
                    className="tabular-nums"
                  />
                </div>

                {/* Inline error warning if discount > subtotal */}
                {discountError && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span className="font-medium">{discountError} Save and Send are blocked until resolved.</span>
                  </div>
                )}
              </section>

              {/* SECTION 6: CUSTOM FIELDS */}
              <section className="glass-card p-6 rounded-[24px] diagonal-highlight space-y-4 border border-white/90">
                <div className="flex items-center justify-between border-b border-slate-200/50 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 border border-cyan-200/50 flex items-center justify-center font-bold text-xs shadow-sm">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold font-heading text-slate-900">6. Custom Fields</h2>
                      <p className="text-[11px] text-slate-500">
                        PO numbers, department codes, or reference IDs
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="pill-secondary"
                    size="sm"
                    disabled={customFieldsList.length >= 20}
                    onClick={() => {
                      const newId = `cf-${Date.now()}`;
                      appendCustomField({
                        id: newId,
                        label: '',
                        value: '',
                        visible: true,
                        position: customFieldsList.length,
                      });
                      setTimeout(() => {
                        newLabelInputRef.current?.focus();
                      }, 50);
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Add Field</span>
                  </Button>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Quick Add:</span>
                  {['PO Number', 'Internal Project Code', 'Contract Ref', 'VAT / Tax ID'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        appendCustomField({
                          id: `cf-${Date.now()}`,
                          label: preset,
                          value: preset === 'PO Number' ? 'PO-77892' : '',
                          visible: preset !== 'Internal Project Code',
                          position: customFieldsList.length,
                        });
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-pill bg-white/80 hover:bg-white text-slate-600 hover:text-blue-600 border border-slate-200/80 transition-all shadow-sm"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                {customFieldsList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No custom fields added yet. Add up to 20 custom attributes.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {customFieldsList.map((cf, index) => {
                        const isVisible = watchedValues.customFields?.[index]?.visible ?? true;
                        return (
                          <motion.div
                            key={cf.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                            className={`p-3.5 rounded-[18px] border transition-all ${
                              isVisible
                                ? 'bg-white/80 border-white/90 shadow-sm'
                                : 'bg-slate-100/70 border-slate-200/80 opacity-70'
                            }`}
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                              <div className="sm:col-span-5">
                                {(() => {
                                  const { ref: formRef, ...rest } = register(`customFields.${index}.label` as const);
                                  return (
                                    <Input
                                      label="Attribute Label"
                                      placeholder="e.g. PO Number"
                                      error={errors.customFields?.[index]?.label?.message}
                                      {...rest}
                                      ref={(el) => {
                                        formRef(el);
                                        if (index === customFieldsList.length - 1) {
                                          newLabelInputRef.current = el;
                                        }
                                      }}
                                    />
                                  );
                                })()}
                              </div>

                              <div className="sm:col-span-5">
                                <Input
                                  label="Attribute Value"
                                  placeholder="e.g. PO-77892"
                                  {...register(`customFields.${index}.value` as const)}
                                  error={errors.customFields?.[index]?.value?.message}
                                />
                              </div>

                              <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-5 sm:pt-4">
                                <Controller
                                  control={control}
                                  name={`customFields.${index}.visible` as const}
                                  render={({ field: { value, onChange } }) => (
                                    <button
                                      type="button"
                                      onClick={() => onChange(!value)}
                                      title={value ? 'Visible on invoice & print' : 'Hidden internal field'}
                                      aria-label={value ? 'Hide on invoice' : 'Show on invoice'}
                                      className={`p-2 rounded-xl transition-colors ${
                                        value
                                          ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/60'
                                          : 'text-slate-400 bg-slate-200/60 hover:bg-slate-200 border border-slate-300/40'
                                      }`}
                                    >
                                      {value ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                  )}
                                />

                                <button
                                  type="button"
                                  onClick={() => removeCustomField(index)}
                                  aria-label={`Remove custom field ${index + 1}`}
                                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            {!isVisible && (
                              <p className="text-[10px] text-slate-500 mt-1 italic">
                                * Hidden fields remain saved in database but are strictly excluded from preview, print, and email.
                              </p>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </section>

              {/* SECTION 7: NOTES */}
              <section className="glass-card p-6 rounded-[24px] diagonal-highlight space-y-4 border border-white/90">
                <div className="flex items-center gap-3 border-b border-slate-200/50 pb-3.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-500/10 text-slate-600 border border-slate-200/50 flex items-center justify-center font-bold text-xs shadow-sm">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold font-heading text-slate-900">7. Notes & Payment Terms</h2>
                    <p className="text-[11px] text-slate-500">Wire details, bank instructions, or payment terms</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <textarea
                    id="invoice-notes"
                    rows={3}
                    maxLength={2000}
                    {...register('notes')}
                    placeholder="Standard Net 30 terms. Thank you for your partnership."
                    className="w-full min-h-[45px] p-3 text-xs rounded-input bg-white/80 border border-white/90 text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 focus:shadow-[0_2px_12px_rgba(37,99,235,0.08)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Appears on printed invoice and email delivery</span>
                    <span>{(watchedValues.notes || '').length}/2000</span>
                  </div>
                </div>
              </section>

              {/* SECTION 8: TOTALS PANEL */}
              <section className="glass-card p-6 rounded-[24px] diagonal-highlight space-y-5 border border-white/90">
                <div className="flex items-center gap-3 border-b border-slate-200/50 pb-3.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-200/50 flex items-center justify-center font-bold text-xs shadow-sm">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold font-heading text-slate-900">8. Summary & Totals</h2>
                    <p className="text-[11px] text-slate-500">Calculated with pure integer cents precision</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>Subtotal:</span>
                    <CountUpNumber
                      valueCents={calculation?.subtotalCents ?? 0}
                      className="font-semibold text-slate-900"
                    />
                  </div>

                  {discountCents > 0 && (
                    <div className="flex justify-between py-1 text-slate-600">
                      <span className="text-emerald-700 font-medium">Discount Applied:</span>
                      <CountUpNumber
                        valueCents={discountCents}
                        prefix="-"
                        className="font-bold text-emerald-600"
                      />
                    </div>
                  )}

                  {taxRateBp > 0 && (
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>Estimated Tax ({basisPointsToPercent(taxRateBp)}%):</span>
                      <CountUpNumber
                        valueCents={calculation?.taxCents ?? 0}
                        className="font-semibold text-slate-900"
                      />
                    </div>
                  )}

                  <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-baseline">
                    <span className="text-sm font-extrabold text-slate-900">Total Due:</span>
                    <CountUpNumber
                      valueCents={calculation?.totalCents ?? 0}
                      className="text-2xl font-black font-heading text-blue-600"
                    />
                  </div>
                </div>

                {discountError && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 text-red-800 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{discountError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="submit"
                    variant="pill-primary"
                    size="md"
                    isLoading={isSaving}
                    disabled={Boolean(discountError)}
                    className="shadow-lg hover:shadow-xl w-full sm:w-auto"
                  >
                    <Save className="w-4 h-4 mr-1.5" />
                    <span className="font-semibold">Save Invoice</span>
                  </Button>
                </div>
              </section>
            </form>
          </div>

          {/* RIGHT PANE: Sticky Live Preview (Desktop) or Tab View (Mobile) */}
          <div
            className={`lg:col-span-6 lg:sticky lg:top-24 print:block print:static ${
              activeTab === 'edit' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="space-y-3">
              <div className="glass-pill px-4 py-2 flex items-center justify-between text-xs border border-white/90 shadow-sm print:hidden">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-bold text-slate-800">Live Paper Sheet</span>
                  <span className="text-slate-400 font-medium">• Zero Float Math</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Updates live as you type</span>
              </div>

              {/* Render Invoice Document */}
              <InvoiceDocument
                number={watchedValues.number || '0000'}
                status={currentInvoice?.status || 'DRAFT'}
                issueDate={watchedValues.issueDate}
                dueDate={watchedValues.dueDate}
                businessName={watchedValues.businessName}
                businessEmail={watchedValues.businessEmail}
                businessAddress={watchedValues.businessAddress}
                customerName={watchedValues.customerName}
                customerEmail={watchedValues.customerEmail}
                customerAddress={watchedValues.customerAddress}
                notes={watchedValues.notes}
                discountCents={discountCents}
                taxRateBp={taxRateBp}
                lineItems={domainLines}
                customFields={watchedValues.customFields || []}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile & Tablet Sticky Bottom Totals Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 px-4 py-3 bg-white/95 backdrop-blur-2xl border-t border-slate-200/90 shadow-[0_-8px_25px_rgba(15,23,42,0.08)] print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Due
            </span>
            <CountUpNumber
              valueCents={calculation?.totalCents ?? 0}
              className="text-lg font-black font-heading text-slate-900 tabular-nums leading-tight"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setActiveTab(activeTab === 'edit' ? 'preview' : 'edit')}
              className="text-xs"
            >
              {activeTab === 'edit' ? (
                <>
                  <Eye className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  <span>Preview</span>
                </>
              ) : (
                <>
                  <Sliders className="w-3.5 h-3.5 mr-1" />
                  <span>Edit</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="pill-primary"
              size="sm"
              onClick={handleSubmit(onSubmit)}
              isLoading={isSaving}
              disabled={Boolean(discountError)}
              className="text-xs shadow-md"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              <span>Save</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Send Dialog */}
      {currentInvoice && (
        <SendDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          invoiceId={currentInvoice.id}
          invoiceNumber={currentInvoice.number}
          defaultEmail={watchedValues.customerEmail || currentInvoice.customerEmail || ''}
          onSuccess={() => {
            setCurrentInvoice({ ...currentInvoice, status: 'SENT' });
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {currentInvoice && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          invoiceNumber={currentInvoice.number}
          customerName={currentInvoice.customerName}
          onConfirm={handleDeleteInvoice}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
