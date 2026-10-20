/**
 * Money and numeric precision helpers
 * Pure integer arithmetic. No floating-point inaccuracies.
 */

/**
 * Integer round half up formula specified in PART A:
 * Math.floor((numerator * 2 + denominator) / (denominator * 2))
 */
export function roundHalfUp(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    throw new Error('Denominator must be greater than 0');
  }
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator)) {
    throw new Error('Inputs to roundHalfUp must be safe integers');
  }
  if (numerator < 0) {
    throw new Error('roundHalfUp does not accept negative numerator');
  }
  return Math.floor((numerator * 2 + denominator) / (denominator * 2));
}

/**
 * Format integer cents as USD currency string
 * e.g., 9900 -> "$99.00"
 */
export function formatCurrency(cents: number): string {
  if (!Number.isFinite(cents)) return '$0.00';
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Convert user string/number dollar input to integer cents.
 * e.g. "50.00" -> 5000, "12.5" -> 1250, 50 -> 5000
 * Throws if negative or exceeds 2 decimal places.
 */
export function dollarsToCents(input: string | number): number {
  const str = String(input).trim();
  if (!str) return 0;

  // Regex check for decimal format with at most 2 decimals
  if (!/^\d+(\.\d{1,2})?$/.test(str)) {
    throw new Error('Invalid price format: maximum 2 decimal places and non-negative values allowed');
  }

  const [whole, dec = ''] = str.split('.');
  const paddedDec = dec.padEnd(2, '0');
  const cents = parseInt(whole, 10) * 100 + parseInt(paddedDec, 10);

  if (!Number.isSafeInteger(cents)) {
    throw new Error('Amount exceeds safe integer range');
  }

  return cents;
}

/**
 * Convert integer cents to dollar string with 2 decimals
 * e.g. 5000 -> "50.00"
 */
export function centsToDollars(cents: number): string {
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const rem = abs % 100;
  const sign = cents < 0 ? '-' : '';
  return `${sign}${whole}.${rem.toString().padStart(2, '0')}`;
}

/**
 * Convert user quantity string/number to integer milli-units (1.000 = 1000).
 * Max 3 decimal places.
 * e.g. "1.5" -> 1500, "2" -> 2000, "0.001" -> 1
 */
export function quantityToMilli(input: string | number): number {
  const str = String(input).trim();
  if (!str) return 0;

  if (!/^\d+(\.\d{1,3})?$/.test(str)) {
    throw new Error('Invalid quantity format: maximum 3 decimal places and positive values allowed');
  }

  const [whole, dec = ''] = str.split('.');
  const paddedDec = dec.padEnd(3, '0');
  const milli = parseInt(whole, 10) * 1000 + parseInt(paddedDec, 10);

  if (!Number.isSafeInteger(milli)) {
    throw new Error('Quantity exceeds safe integer range');
  }

  return milli;
}

/**
 * Convert milli-units to decimal quantity string without trailing zeroes
 * e.g. 1500 -> "1.5", 2000 -> "2", 333 -> "0.333"
 */
export function milliToQuantity(milli: number): string {
  const whole = Math.floor(milli / 1000);
  const rem = milli % 1000;
  if (rem === 0) return `${whole}`;
  const decStr = rem.toString().padStart(3, '0').replace(/0+$/, '');
  return `${whole}.${decStr}`;
}

/**
 * Convert tax rate percentage string/number to basis points (10% = 1000, 8.25% = 825).
 * Max 2 decimal places. Range: 0 to 100.
 */
export function percentToBasisPoints(input: string | number): number {
  const str = String(input).trim();
  if (!str) return 0;

  if (!/^\d+(\.\d{1,2})?$/.test(str)) {
    throw new Error('Invalid tax rate format: maximum 2 decimal places allowed');
  }

  const [whole, dec = ''] = str.split('.');
  const paddedDec = dec.padEnd(2, '0');
  const bp = parseInt(whole, 10) * 100 + parseInt(paddedDec, 10);

  if (bp < 0 || bp > 10000) {
    throw new Error('Tax rate must be between 0 and 100.');
  }

  return bp;
}

/**
 * Convert basis points to percentage string
 * e.g. 1000 -> "10", 825 -> "8.25"
 */
export function basisPointsToPercent(bp: number): string {
  const whole = Math.floor(bp / 100);
  const rem = bp % 100;
  if (rem === 0) return `${whole}`;
  const decStr = rem.toString().padStart(2, '0').replace(/0+$/, '');
  return `${whole}.${decStr}`;
}
