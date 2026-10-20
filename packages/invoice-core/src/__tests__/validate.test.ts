import { describe, it, expect } from 'vitest';
import {
  validateInvoice,
  validateDates,
  validateEmail,
  validateCustomFields,
  validateDiscount,
} from '../validate';

describe('Invoice Validation Rules (PART A Spec Table)', () => {
  const validDraftInvoice = {
    number: 'INV-2026-001',
    issueDate: '2026-10-20',
    dueDate: '2026-11-20',
    businessName: 'Acme Design Studio',
    businessEmail: 'billing@example.com',
    customerName: 'Global Logistics Corp',
    customerEmail: 'contact@example.com',
    notes: 'Thank you for your business.',
    lineItems: [
      {
        description: 'Brand Identity & Design System',
        quantityMilli: 1000,
        unitPriceCents: 500000,
      },
    ],
    discountCents: 0,
    taxRateBp: 1000,
    subtotalCents: 500000,
  };

  it('passes a fully valid invoice', () => {
    const res = validateInvoice(validDraftInvoice);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  describe('Invoice Number Rules', () => {
    it('requires invoice number', () => {
      const res = validateInvoice({ ...validDraftInvoice, number: '' });
      expect(res.valid).toBe(false);
      expect(res.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'number' })]),
      );
    });

    it('rejects invoice number over 40 chars', () => {
      const res = validateInvoice({ ...validDraftInvoice, number: 'A'.repeat(41) });
      expect(res.valid).toBe(false);
      expect(res.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'number' })]),
      );
    });
  });

  describe('Dates Rules', () => {
    it('accepts due date on issue date', () => {
      const res = validateDates('2026-10-20', '2026-10-20');
      expect(res.issueDateError).toBeUndefined();
      expect(res.dueDateError).toBeUndefined();
    });

    it('accepts due date after issue date', () => {
      const res = validateDates('2026-10-20', '2026-10-25');
      expect(res.issueDateError).toBeUndefined();
      expect(res.dueDateError).toBeUndefined();
    });

    it('rejects due date before issue date', () => {
      const res = validateDates('2026-10-20', '2026-10-15');
      expect(res.dueDateError).toBe('Due date cannot be before the issue date.');
    });
  });

  describe('Business and Customer Names', () => {
    it('rejects empty or over 120 chars names', () => {
      const res = validateInvoice({
        ...validDraftInvoice,
        businessName: '',
        customerName: 'X'.repeat(121),
      });
      expect(res.valid).toBe(false);
      expect(res.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'businessName' }),
          expect.objectContaining({ field: 'customerName' }),
        ]),
      );
    });
  });

  describe('Email Validation Rules', () => {
    it('accepts valid email', () => {
      expect(validateEmail('test@example.com')).toBeNull();
    });

    it('rejects invalid email', () => {
      expect(validateEmail('not-an-email')).toBe('Enter a valid email.');
    });

    it('requires customer email when sending', () => {
      const res = validateInvoice(
        { ...validDraftInvoice, customerEmail: '' },
        { isSending: true },
      );
      expect(res.valid).toBe(false);
      expect(res.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'customerEmail' })]),
      );
    });
  });

  describe('Line Items Rules', () => {
    it('allows 0 line items for draft', () => {
      const res = validateInvoice({ ...validDraftInvoice, lineItems: [] });
      expect(res.valid).toBe(true);
    });

    it('rejects 0 line items when sending', () => {
      const res = validateInvoice({ ...validDraftInvoice, lineItems: [] }, { isSending: true });
      expect(res.valid).toBe(false);
      expect(res.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'lineItems' })]),
      );
    });

    it('validates each line item description, quantity, and unit price', () => {
      const res = validateInvoice({
        ...validDraftInvoice,
        lineItems: [
          { description: '', quantityMilli: 0, unitPriceCents: -500 },
        ],
      });
      expect(res.valid).toBe(false);
      expect(res.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'lineItems[0].description' }),
          expect.objectContaining({ field: 'lineItems[0].quantityMilli' }),
          expect.objectContaining({ field: 'lineItems[0].unitPriceCents' }),
        ]),
      );
    });
  });

  describe('Discount and Subtotal Rules', () => {
    it('enforces discount cannot exceed subtotal ($X)', () => {
      const err = validateDiscount(6000, 5000);
      expect(err).toBe('Discount cannot exceed the subtotal ($50.00).');
    });

    it('allows discount equal to subtotal', () => {
      const err = validateDiscount(5000, 5000);
      expect(err).toBeNull();
    });
  });

  describe('Custom Fields Rules', () => {
    it('rejects more than 20 custom fields', () => {
      const fields = Array.from({ length: 21 }, (_, i) => ({
        id: `${i}`,
        label: `Label ${i}`,
        value: `Val ${i}`,
        visible: true,
        position: i,
      }));
      const errs = validateCustomFields(fields);
      expect(errs).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'customFields' })]),
      );
    });

    it('rejects empty label or value over 300 chars', () => {
      const fields = [
        { id: '1', label: '', value: 'A'.repeat(301), visible: true, position: 0 },
      ];
      const errs = validateCustomFields(fields);
      expect(errs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'customFields[0].label' }),
          expect.objectContaining({ field: 'customFields[0].value' }),
        ]),
      );
    });
  });
});
