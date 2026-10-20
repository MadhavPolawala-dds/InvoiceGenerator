export interface EmailTemplateParams {
  to_email: string;
  to_name: string;
  invoice_number: string;
  business_name: string;
  issue_date: string;
  due_date: string;
  items_html: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  notes?: string;
  custom_fields_html: string;
  view_url: string;
  reply_to?: string;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  params: EmailTemplateParams;
}

export interface MailDriver {
  send(options: SendMailOptions): Promise<{ success: boolean; messageId?: string }>;
}
