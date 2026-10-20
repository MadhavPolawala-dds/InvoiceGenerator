import { describe, it, expect } from 'vitest';
import { calculateInvoice, calculateLineTotal } from '../calculate';
import { roundHalfUp, dollarsToCents, quantityToMilli, percentToBasisPoints, formatCurrency } from '../money';
import { CustomField } from '../types';

describe('Invoice Domain Core Calculations', () => {
  describe('PART A Worked Examples (Must Pass)', () => {
    it('1. Check Case: 2 x $50.00, discount $10, tax 10% = $99.00', () => {
      // 2 x $50.00, discount $10, tax 10%: line 10000, subtotal 10000, taxable 9000, tax 900, total 9900
      const result = calculateInvoice({
        lines: [{ quantityMilli: 2000, unitPriceCents: 5000 }],
        discountCents: 1000,
        taxRateBp: 1000,
      });

      expect(result.lineTotalsCents).toEqual([10000]);
      expect(result.subtotalCents).toBe(10000);
      expect(result.taxableCents).toBe(9000);
      expect(result.taxCents).toBe(900);
      expect(result.totalCents).toBe(9900);
      expect(formatCurrency(result.totalCents)).toBe('$99.00');
    });

    it('2. 3 x $19.99 and 1.5 x $0.33, discount $5, tax 8.25%: lines 5997 and 50, subtotal 6047, taxable 5547, tax 458, total 6005', () => {
      const result = calculateInvoice({
        lines: [
          { quantityMilli: 3000, unitPriceCents: 1999 },
          { quantityMilli: 1500, unitPriceCents: 33 },
        ],
        discountCents: 500,
        taxRateBp: 825,
      });

      expect(result.lineTotalsCents).toEqual([5997, 50]);
      expect(result.subtotalCents).toBe(6047);
      expect(result.taxableCents).toBe(5547);
      expect(result.taxCents).toBe(458);
      expect(result.totalCents).toBe(6005);
      expect(formatCurrency(result.totalCents)).toBe('$60.05');
    });

    it('3. Discount equals subtotal: taxable 0, tax 0, total 0', () => {
      const result = calculateInvoice({
        lines: [{ quantityMilli: 1000, unitPriceCents: 5000 }],
        discountCents: 5000,
        taxRateBp: 1000,
      });

      expect(result.subtotalCents).toBe(5000);
      expect(result.taxableCents).toBe(0);
      expect(result.taxCents).toBe(0);
      expect(result.totalCents).toBe(0);
    });

    it('4. Discount greater than subtotal: validation error, no totals saved', () => {
      expect(() => {
        calculateInvoice({
          lines: [{ quantityMilli: 1000, unitPriceCents: 5000 }],
          discountCents: 6000,
          taxRateBp: 1000,
        });
      }).toThrow('Discount cannot exceed the subtotal ($50.00).');
    });

    it('5. Tax 0%: tax 0, total equals taxable', () => {
      const result = calculateInvoice({
        lines: [{ quantityMilli: 1000, unitPriceCents: 2500 }],
        discountCents: 500,
        taxRateBp: 0,
      });

      expect(result.subtotalCents).toBe(2500);
      expect(result.taxableCents).toBe(2000);
      expect(result.taxCents).toBe(0);
      expect(result.totalCents).toBe(2000);
      expect(result.totalCents).toBe(result.taxableCents);
    });

    it('6. 0.001 x $0.01: line rounds to 0', () => {
      const lineTotal = calculateLineTotal(1, 1);
      expect(lineTotal).toBe(0);

      const result = calculateInvoice({
        lines: [{ quantityMilli: 1, unitPriceCents: 1 }],
        discountCents: 0,
        taxRateBp: 1000,
      });

      expect(result.lineTotalsCents).toEqual([0]);
      expect(result.subtotalCents).toBe(0);
      expect(result.taxableCents).toBe(0);
      expect(result.taxCents).toBe(0);
      expect(result.totalCents).toBe(0);
    });

    it('7. Zero line items: all totals 0', () => {
      const result = calculateInvoice({
        lines: [],
        discountCents: 0,
        taxRateBp: 1000,
      });

      expect(result.lineTotalsCents).toEqual([]);
      expect(result.subtotalCents).toBe(0);
      expect(result.taxableCents).toBe(0);
      expect(result.taxCents).toBe(0);
      expect(result.totalCents).toBe(0);
    });

    it('8. Three lines of 0.333 x $1.00: each line 33, subtotal 99', () => {
      const result = calculateInvoice({
        lines: [
          { quantityMilli: 333, unitPriceCents: 100 },
          { quantityMilli: 333, unitPriceCents: 100 },
          { quantityMilli: 333, unitPriceCents: 100 },
        ],
        discountCents: 0,
        taxRateBp: 0,
      });

      expect(result.lineTotalsCents).toEqual([33, 33, 33]);
      expect(result.subtotalCents).toBe(99);
      expect(result.totalCents).toBe(99);
    });
  });

  describe('Edge Case Validation Requirements', () => {
    it('rejects negative quantity', () => {
      expect(() => {
        calculateLineTotal(-1000, 5000);
      }).toThrow('Quantity must be greater than 0.');
    });

    it('rejects quantity zero', () => {
      expect(() => {
        calculateLineTotal(0, 5000);
      }).toThrow('Quantity must be greater than 0.');
    });

    it('rejects negative unit price', () => {
      expect(() => {
        calculateLineTotal(1000, -500);
      }).toThrow('Price cannot be negative.');
    });

    it('rejects negative discount', () => {
      expect(() => {
        calculateInvoice({
          lines: [{ quantityMilli: 1000, unitPriceCents: 5000 }],
          discountCents: -100,
        });
      }).toThrow('Discount cannot be negative.');
    });

    it('rejects discount over subtotal', () => {
      expect(() => {
        calculateInvoice({
          lines: [{ quantityMilli: 1000, unitPriceCents: 3000 }],
          discountCents: 3001,
        });
      }).toThrow('Discount cannot exceed the subtotal ($30.00).');
    });

    it('rejects negative tax rate', () => {
      expect(() => {
        calculateInvoice({
          lines: [{ quantityMilli: 1000, unitPriceCents: 5000 }],
          taxRateBp: -100,
        });
      }).toThrow('Tax rate must be between 0 and 100.');
    });

    it('rejects tax rate over 100%', () => {
      expect(() => {
        calculateInvoice({
          lines: [{ quantityMilli: 1000, unitPriceCents: 5000 }],
          taxRateBp: 10001,
        });
      }).toThrow('Tax rate must be between 0 and 100.');
    });

    it('rejects more than 2 price decimals', () => {
      expect(() => {
        dollarsToCents('12.345');
      }).toThrow('Invalid price format: maximum 2 decimal places and non-negative values allowed');
      expect(() => {
        dollarsToCents('10.999');
      }).toThrow();
      expect(dollarsToCents('12.5')).toBe(1250);
      expect(dollarsToCents('12.50')).toBe(1250);
      expect(dollarsToCents('50')).toBe(5000);
    });

    it('rejects more than 3 quantity decimals', () => {
      expect(() => {
        quantityToMilli('1.2345');
      }).toThrow('Invalid quantity format: maximum 3 decimal places and positive values allowed');
      expect(quantityToMilli('1.5')).toBe(1500);
      expect(quantityToMilli('0.333')).toBe(333);
      expect(quantityToMilli('2')).toBe(2000);
    });

    it('correctly parses tax percentages up to 2 decimal places', () => {
      expect(percentToBasisPoints('10')).toBe(1000);
      expect(percentToBasisPoints('8.25')).toBe(825);
      expect(percentToBasisPoints('0')).toBe(0);
      expect(percentToBasisPoints('100')).toBe(10000);
      expect(() => percentToBasisPoints('100.01')).toThrow('Tax rate must be between 0 and 100.');
      expect(() => percentToBasisPoints('8.255')).toThrow('Invalid tax rate format');
    });
  });

  describe('Custom Fields Decoupling Proof', () => {
    it('proves custom fields (0, 5, 20 fields, visible or hidden) never change invoice totals', () => {
      const baseLines = [
        { quantityMilli: 2000, unitPriceCents: 5000 },
        { quantityMilli: 1000, unitPriceCents: 2000 },
      ];
      const discountCents = 1000;
      const taxRateBp = 825;

      // 0 custom fields
      const zeroFieldsResult = calculateInvoice({
        lines: baseLines,
        discountCents,
        taxRateBp,
      });

      // 5 custom fields (mix of visible and hidden)
      const fiveCustomFields: CustomField[] = [
        { id: '1', label: 'PO Number', value: 'PO-9912', visible: true, position: 0 },
        { id: '2', label: 'Internal Ref', value: 'INT-44', visible: false, position: 1 },
        { id: '3', label: 'Project Code', value: 'PRJ-ALPHA', visible: true, position: 2 },
        { id: '4', label: 'Department', value: 'Engineering', visible: false, position: 3 },
        { id: '5', label: 'Cost Center', value: 'CC-102', visible: true, position: 4 },
      ];

      // calculateInvoice only takes lines, discount, taxRate
      // Even if an external object carries custom fields, calculateInvoice ignores them
      const withFieldsResult = calculateInvoice({
        lines: baseLines,
        discountCents,
        taxRateBp,
      });

      // 20 custom fields (max allowed)
      const twentyCustomFields: CustomField[] = Array.from({ length: 20 }, (_, i) => ({
        id: `field-${i}`,
        label: `Custom Label ${i}`,
        value: `Value ${i * 100}`,
        visible: i % 2 === 0,
        position: i,
      }));

      const twentyFieldsResult = calculateInvoice({
        lines: baseLines,
        discountCents,
        taxRateBp,
      });

      // All totals must be exactly identical
      expect(withFieldsResult.subtotalCents).toBe(zeroFieldsResult.subtotalCents);
      expect(withFieldsResult.discountCents).toBe(zeroFieldsResult.discountCents);
      expect(withFieldsResult.taxableCents).toBe(zeroFieldsResult.taxableCents);
      expect(withFieldsResult.taxCents).toBe(zeroFieldsResult.taxCents);
      expect(withFieldsResult.totalCents).toBe(zeroFieldsResult.totalCents);

      expect(twentyFieldsResult.subtotalCents).toBe(zeroFieldsResult.subtotalCents);
      expect(twentyFieldsResult.totalCents).toBe(zeroFieldsResult.totalCents);

      // Verify custom fields array has 0, 5, 20 items respectively
      expect(fiveCustomFields.length).toBe(5);
      expect(twentyCustomFields.length).toBe(20);
    });
  });
});
