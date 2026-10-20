/**
 * Typed API client for Invoice Generator backend
 * The only environment variable allowed in apps/web is NEXT_PUBLIC_API_URL
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface ApiLineItem {
  id?: string;
  position: number;
  description: string;
  quantityMilli: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface ApiCustomField {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  position: number;
}

export interface ApiInvoice {
  id: string;
  number: string;
  status: 'DRAFT' | 'SENT';
  currency: 'USD';
  issueDate: string;
  dueDate: string;
  businessName: string;
  businessEmail?: string | null;
  businessAddress?: string | null;
  customerName: string;
  customerEmail?: string | null;
  customerAddress?: string | null;
  notes?: string | null;
  discountCents: number;
  taxRateBp: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  customFields: ApiCustomField[];
  lineItems: ApiLineItem[];
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoicePayload {
  number: string;
  issueDate: string;
  dueDate: string;
  businessName: string;
  businessEmail?: string;
  businessAddress?: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  notes?: string;
  discountCents?: number;
  taxRateBp?: number;
  customFields?: ApiCustomField[];
  lineItems: Array<{
    description: string;
    quantityMilli: number;
    unitPriceCents: number;
    position?: number;
  }>;
}

export interface SendInvoicePayload {
  toEmail: string;
  message?: string;
}

export class ApiError extends Error {
  statusCode: number;
  errors?: Array<{ field: string; message: string }>;

  constructor(message: string, statusCode: number, errors?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.message || 'API request failed',
      response.status,
      data.errors,
    );
  }

  return data as T;
}

export const api = {
  getInvoices: () => request<ApiInvoice[]>('/invoices'),
  getInvoice: (id: string) => request<ApiInvoice>(`/invoices/${id}`),
  createInvoice: (payload: CreateInvoicePayload) =>
    request<ApiInvoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateInvoice: (id: string, payload: CreateInvoicePayload) =>
    request<ApiInvoice>(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteInvoice: (id: string) =>
    request<void>(`/invoices/${id}`, {
      method: 'DELETE',
    }),
  sendInvoice: (id: string, payload: SendInvoicePayload) =>
    request<{ status: string }>(`/invoices/${id}/send`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
