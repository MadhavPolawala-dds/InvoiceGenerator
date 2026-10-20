import { formatCurrency, milliToQuantity } from '@invoice/invoice-core';

/**
 * Robust HTML escaping for XSS protection in email content.
 * Escapes &, <, >, ", '
 */
export function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface LineItemLike {
  description: string;
  quantityMilli: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface CustomFieldLike {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  position: number;
}

/**
 * Builds HTML table rows for line items with strict HTML escaping
 */
export function buildItemsHtml(items: LineItemLike[]): string {
  if (!items || items.length === 0) {
    return '<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 12px;">No line items</td></tr>';
  }

  return items
    .map((item) => {
      const desc = escapeHtml(item.description);
      const qty = escapeHtml(milliToQuantity(item.quantityMilli));
      const price = escapeHtml(formatCurrency(item.unitPriceCents));
      const total = escapeHtml(formatCurrency(item.lineTotalCents));

      return `<tr>
  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #1e293b;">${desc}</td>
  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; text-align: center; color: #475569;">${qty}</td>
  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; text-align: right; color: #475569; font-variant-numeric: tabular-nums;">${price}</td>
  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; text-align: right; font-weight: 600; color: #0f172a; font-variant-numeric: tabular-nums;">${total}</td>
</tr>`;
    })
    .join('\n');
}

/**
 * Builds HTML for custom fields.
 * CRITICAL RULE: ONLY includes visible custom fields (visible === true).
 * Hidden custom fields are strictly excluded from the output.
 */
export function buildCustomFieldsHtml(fields: CustomFieldLike[]): string {
  if (!fields || !Array.isArray(fields)) return '';

  const visibleFields = fields.filter((f) => f.visible === true);
  if (visibleFields.length === 0) return '';

  const rows = visibleFields
    .map((field) => {
      const label = escapeHtml(field.label);
      const value = escapeHtml(field.value);
      return `<div style="margin-bottom: 6px;">
  <span style="font-weight: 700; color: #475569;">${label}:</span>
  <span style="color: #0f172a; margin-left: 6px;">${value}</span>
</div>`;
    })
    .join('\n');

  return `<div class="custom-fields-box" style="margin-top: 20px; padding: 14px 16px; background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 12px;">
  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Additional Information</div>
${rows}
</div>`;
}
