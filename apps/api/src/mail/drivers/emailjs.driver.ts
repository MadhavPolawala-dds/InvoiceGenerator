import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { MailDriver, SendMailOptions } from '../mail.interface';

@Injectable()
export class EmailJSDriver implements MailDriver {
  private readonly logger = new Logger(EmailJSDriver.name);

  async send(options: SendMailOptions): Promise<{ success: boolean; messageId?: string }> {
    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;

    if (!serviceId || !templateId || !publicKey) {
      throw new BadGatewayException(
        'Email service is not configured properly. Missing required EmailJS parameters.',
      );
    }

    const payload = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey || undefined,
      template_params: {
        to_email: options.to,
        to_name: options.params.to_name,
        invoice_number: options.params.invoice_number,
        business_name: options.params.business_name,
        issue_date: options.params.issue_date,
        due_date: options.params.due_date,
        items_html: options.params.items_html,
        subtotal: options.params.subtotal,
        discount: options.params.discount,
        tax: options.params.tax,
        total: options.params.total,
        notes: options.params.notes || '',
        custom_fields_html: options.params.custom_fields_html || '',
        view_url: options.params.view_url,
        reply_to: options.params.reply_to || '',
      },
    };

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'InvoiceGenerator/1.0',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`EmailJS delivery failed with status ${response.status}: ${errorText}`);
        // Never leak secrets or private tokens in response to user
        throw new BadGatewayException(
          'Email provider failed to deliver the message. Please verify template and recipient settings.',
        );
      }

      const responseText = await response.text();
      return {
        success: true,
        messageId: responseText || 'OK',
      };
    } catch (error: any) {
      if (error instanceof BadGatewayException) {
        throw error;
      }
      this.logger.error(`Network error sending email via EmailJS: ${error.message}`);
      throw new BadGatewayException(
        'Failed to reach email service provider. Please check network connectivity and try again.',
      );
    }
  }
}
