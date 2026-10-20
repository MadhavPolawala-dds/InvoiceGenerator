import { CustomField, LineItemInput, ValidationResult, ValidationErrorItem } from './types';
import { formatCurrency } from './money';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate quantity milli-units:
 * > 0, max 1,000,000 units (1,000,000,000 milli-units)
 */
export function validateQuantity(quantityMilli: number): string | null {
  if (!Number.isSafeInteger(quantityMilli) || quantityMilli <= 0) {
    return 'Quantity must be greater than 0.';
  }
  if (quantityMilli > 1_000_000_000) {
    return 'Quantity cannot exceed 1,000,000.';
  }
  return null;
}

/**
 * Validate unit price cents:
 * >= 0, max 10,000,000.00 ($10M = 1,000,000,000 cents)
 */
export function validateUnitPrice(unitPriceCents: number): string | null {
  if (!Number.isSafeInteger(unitPriceCents) || unitPriceCents < 0) {
    return 'Price cannot be negative.';
  }
  if (unitPriceCents > 1_000_000_000) {
    return 'Price cannot exceed 10,000,000.00.';
  }
  return null;
}

/**
 * Validate discount cents:
 * >= 0, cannot exceed subtotal
 */
export function validateDiscount(discountCents: number, subtotalCents: number): string | null {
  if (!Number.isSafeInteger(discountCents) || discountCents < 0) {
    return 'Discount cannot be negative.';
  }
  if (discountCents > subtotalCents) {
    return `Discount cannot exceed the subtotal (${formatCurrency(subtotalCents)}).`;
  }
  return null;
}

/**
 * Validate tax rate basis points:
 * 0 to 10000 (0% to 100%)
 */
export function validateTaxRate(taxRateBp: number): string | null {
  if (!Number.isSafeInteger(taxRateBp) || taxRateBp < 0 || taxRateBp > 10000) {
    return 'Tax rate must be between 0 and 100.';
  }
  return null;
}

/**
 * Validate item description:
 * required, 1 to 200 chars
 */
export function validateDescription(description: string): string | null {
  const trimmed = description ? description.trim() : '';
  if (!trimmed || trimmed.length === 0) {
    return 'Add a description.';
  }
  if (trimmed.length > 200) {
    return 'Description cannot exceed 200 characters.';
  }
  return null;
}

/**
 * Validate invoice dates:
 * issueDate: valid YYYY-MM-DD
 * dueDate: valid YYYY-MM-DD, on or after issueDate
 */
export function validateDates(issueDate: string, dueDate: string): { issueDateError?: string; dueDateError?: string } {
  const errors: { issueDateError?: string; dueDateError?: string } = {};

  if (!issueDate || !DATE_REGEX.test(issueDate) || isNaN(Date.parse(issueDate))) {
    errors.issueDateError = 'Enter a valid issue date.';
  }

  if (!dueDate || !DATE_REGEX.test(dueDate) || isNaN(Date.parse(dueDate))) {
    errors.dueDateError = 'Enter a valid due date.';
  } else if (!errors.issueDateError && dueDate < issueDate) {
    errors.dueDateError = 'Due date cannot be before the issue date.';
  }

  return errors;
}

/**
 * Validate email address
 */
export function validateEmail(email?: string, required = false): string | null {
  if (!email || !email.trim()) {
    return required ? 'Enter a valid email.' : null;
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Enter a valid email.';
  }
  return null;
}

/**
 * Validate custom fields array:
 * label 1 to 60, value 0 to 300, max 20 fields
 */
export function validateCustomFields(fields: CustomField[]): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = [];

  if (fields.length > 20) {
    errors.push({ field: 'customFields', message: 'Maximum 20 custom fields allowed.' });
  }

  fields.forEach((field, index) => {
    const label = field.label ? field.label.trim() : '';
    const value = field.value ? field.value.trim() : '';

    if (!label || label.length < 1 || label.length > 60) {
      errors.push({ field: `customFields[${index}].label`, message: 'Label must be between 1 and 60 characters.' });
    }
    if (value.length > 300) {
      errors.push({ field: `customFields[${index}].value`, message: 'Value cannot exceed 300 characters.' });
    }
  });

  return errors;
}

/**
 * Comprehensive invoice validation
 */
export function validateInvoice(
  invoice: {
    number: string;
    issueDate: string;
    dueDate: string;
    businessName: string;
    businessEmail?: string;
    customerName: string;
    customerEmail?: string;
    notes?: string;
    lineItems: LineItemInput[];
    discountCents: number;
    taxRateBp: number;
    subtotalCents?: number;
    customFields?: CustomField[];
  },
  options: { isSending?: boolean } = {},
): ValidationResult {
  const errors: ValidationErrorItem[] = [];

  // Invoice Number
  const number = invoice.number ? invoice.number.trim() : '';
  if (!number) {
    errors.push({ field: 'number', message: 'Invoice number is required.' });
  } else if (number.length > 40) {
    errors.push({ field: 'number', message: 'Invoice number cannot exceed 40 characters.' });
  }

  // Business Name
  const businessName = invoice.businessName ? invoice.businessName.trim() : '';
  if (!businessName || businessName.length < 1 || businessName.length > 120) {
    errors.push({ field: 'businessName', message: 'Business name must be between 1 and 120 characters.' });
  }

  // Customer Name
  const customerName = invoice.customerName ? invoice.customerName.trim() : '';
  if (!customerName || customerName.length < 1 || customerName.length > 120) {
    errors.push({ field: 'customerName', message: 'Customer name must be between 1 and 120 characters.' });
  }

  // Emails
  if (invoice.businessEmail) {
    const err = validateEmail(invoice.businessEmail, false);
    if (err) errors.push({ field: 'businessEmail', message: err });
  }

  const customerEmailErr = validateEmail(invoice.customerEmail, options.isSending);
  if (customerEmailErr) {
    errors.push({ field: 'customerEmail', message: customerEmailErr });
  }

  // Dates
  const dateErrors = validateDates(invoice.issueDate, invoice.dueDate);
  if (dateErrors.issueDateError) {
    errors.push({ field: 'issueDate', message: dateErrors.issueDateError });
  }
  if (dateErrors.dueDateError) {
    errors.push({ field: 'dueDate', message: dateErrors.dueDateError });
  }

  // Notes
  if (invoice.notes && invoice.notes.length > 2000) {
    errors.push({ field: 'notes', message: 'Notes cannot exceed 2000 characters.' });
  }

  // Line items
  if (options.isSending && (!invoice.lineItems || invoice.lineItems.length === 0)) {
    errors.push({ field: 'lineItems', message: 'At least one line item is required to send.' });
  }

  if (invoice.lineItems) {
    invoice.lineItems.forEach((item, index) => {
      const descErr = validateDescription(item.description);
      if (descErr) errors.push({ field: `lineItems[${index}].description`, message: descErr });

      const qtyErr = validateQuantity(item.quantityMilli);
      if (qtyErr) errors.push({ field: `lineItems[${index}].quantityMilli`, message: qtyErr });

      const priceErr = validateUnitPrice(item.unitPriceCents);
      if (priceErr) errors.push({ field: `lineItems[${index}].unitPriceCents`, message: priceErr });
    });
  }

  // Tax rate
  const taxErr = validateTaxRate(invoice.taxRateBp);
  if (taxErr) errors.push({ field: 'taxRateBp', message: taxErr });

  // Discount
  if (invoice.subtotalCents !== undefined) {
    const discErr = validateDiscount(invoice.discountCents, invoice.subtotalCents);
    if (discErr) errors.push({ field: 'discountCents', message: discErr });
  }

  // Custom fields
  if (invoice.customFields && invoice.customFields.length > 0) {
    errors.push(...validateCustomFields(invoice.customFields));
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
