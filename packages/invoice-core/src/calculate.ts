import { CalculateInvoiceInput, CalculatedInvoiceResult } from './types';
import { roundHalfUp, formatCurrency } from './money';

/**
 * Calculate line total in integer cents.
 * Formula: roundHalfUp(quantityMilli * unitPriceCents / 1000)
 */
export function calculateLineTotal(quantityMilli: number, unitPriceCents: number): number {
  if (!Number.isSafeInteger(quantityMilli) || !Number.isSafeInteger(unitPriceCents)) {
    throw new Error('Quantity and unit price must be safe integers');
  }

  if (quantityMilli <= 0) {
    throw new Error('Quantity must be greater than 0.');
  }

  if (unitPriceCents < 0) {
    throw new Error('Price cannot be negative.');
  }

  const numerator = quantityMilli * unitPriceCents;
  return roundHalfUp(numerator, 1000);
}

/**
 * Calculate complete invoice totals according to exact domain rules:
 * 1. lineTotalCents = roundHalfUp(quantityMilli * unitPriceCents / 1000) per line
 * 2. subtotalCents = sum(lineTotalCents)
 * 3. taxableCents = subtotalCents - discountCents
 * 4. taxCents = roundHalfUp(taxableCents * taxRateBp / 10000)
 * 5. totalCents = taxableCents + taxCents
 *
 * NOTE: Strictly accepts only { lines, discountCents, taxRateBp }.
 * Custom fields are not accepted.
 */
export function calculateInvoice(input: CalculateInvoiceInput): CalculatedInvoiceResult {
  const { lines = [], discountCents = 0, taxRateBp = 0 } = input;

  // Validate discount
  if (!Number.isSafeInteger(discountCents) || discountCents < 0) {
    throw new Error('Discount cannot be negative.');
  }

  // Validate tax rate
  if (!Number.isSafeInteger(taxRateBp) || taxRateBp < 0 || taxRateBp > 10000) {
    throw new Error('Tax rate must be between 0 and 100.');
  }

  // 1. Calculate each line total
  const lineTotalsCents: number[] = [];
  let subtotalCents = 0;

  for (const line of lines) {
    const lineTotal = calculateLineTotal(line.quantityMilli, line.unitPriceCents);
    lineTotalsCents.push(lineTotal);
    subtotalCents += lineTotal;
  }

  // 2. Validate discount against subtotal
  if (discountCents > subtotalCents) {
    const formattedSubtotal = formatCurrency(subtotalCents);
    throw new Error(`Discount cannot exceed the subtotal (${formattedSubtotal}).`);
  }

  // 3. Taxable amount
  const taxableCents = subtotalCents - discountCents;

  // 4. Tax amount: roundHalfUp(taxableCents * taxRateBp / 10000)
  let taxCents = 0;
  if (taxableCents > 0 && taxRateBp > 0) {
    const taxNumerator = taxableCents * taxRateBp;
    taxCents = roundHalfUp(taxNumerator, 10000);
  }

  // 5. Total amount
  const totalCents = taxableCents + taxCents;

  return {
    lineTotalsCents,
    subtotalCents,
    discountCents,
    taxableCents,
    taxRateBp,
    taxCents,
    totalCents,
  };
}
