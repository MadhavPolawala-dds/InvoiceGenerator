/**
 * Domain types for Invoice Generator
 * Pure TypeScript, zero framework dependencies.
 */

export type InvoiceStatus = 'DRAFT' | 'SENT';

export interface CustomField {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  position: number;
}

export interface LineItemInput {
  description: string;
  quantityMilli: number;     // e.g., 1.000 = 1000 (integer milli-units, max 3 decimals)
  unitPriceCents: number;    // e.g., $50.00 = 5000 (integer cents, max 2 decimals)
}

export interface LineItem extends LineItemInput {
  id?: string;
  position: number;
  lineTotalCents: number;    // computed integer cents
}

export interface InvoiceTotals {
  subtotalCents: number;     // sum of line totals in cents
  discountCents: number;     // fixed discount in cents
  taxableCents: number;      // subtotalCents - discountCents
  taxRateBp: number;         // basis points, e.g. 10% = 1000, 8.25% = 825
  taxCents: number;          // computed tax in cents
  totalCents: number;        // taxableCents + taxCents
}

/**
 * calculateInvoice accepts ONLY lines, discountCents, and taxRateBp.
 * Custom fields are strictly prohibited from entering calculation.
 */
export interface CalculateInvoiceInput {
  lines: Array<{
    quantityMilli: number;
    unitPriceCents: number;
  }>;
  discountCents?: number;
  taxRateBp?: number;
}

export interface CalculatedInvoiceResult extends InvoiceTotals {
  lineTotalsCents: number[];
}

export interface InvoiceDomain {
  id?: string;
  number: string;
  status: InvoiceStatus;
  currency: 'USD';
  issueDate: string;         // YYYY-MM-DD
  dueDate: string;           // YYYY-MM-DD
  businessName: string;
  businessEmail?: string;
  businessAddress?: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  notes?: string;
  discountCents: number;
  taxRateBp: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  customFields: CustomField[];
  lineItems: LineItem[];
  sentAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ValidationErrorItem {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationErrorItem[];
}
