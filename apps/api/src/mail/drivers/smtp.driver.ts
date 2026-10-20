import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { MailDriver, SendMailOptions } from '../mail.interface';
import * as nodemailer from 'nodemailer';

@Injectable()
export class SmtpDriver implements MailDriver {
  private readonly logger = new Logger(SmtpDriver.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_PORT === '465',
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
      });
    }
  }

  async send(options: SendMailOptions): Promise<{ success: boolean; messageId?: string }> {
    if (!this.transporter) {
      throw new BadGatewayException('SMTP server is not configured.');
    }

    try {
      const from = process.env.SMTP_FROM || 'noreply@example.com';
      const info = await this.transporter.sendMail({
        from: `"${options.params.business_name}" <${from}>`,
        to: options.to,
        subject: options.subject,
        html: `
          <h2>Invoice ${options.params.invoice_number} from ${options.params.business_name}</h2>
          <p><strong>Billed to:</strong> ${options.params.to_name} (${options.params.to_email})</p>
          <p><strong>Issue Date:</strong> ${options.params.issue_date} | <strong>Due Date:</strong> ${options.params.due_date}</p>
          <hr />
          <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>${options.params.items_html}</tbody>
          </table>
          <p><strong>Total:</strong> ${options.params.total}</p>
          ${options.params.custom_fields_html}
          ${options.params.notes ? `<p><strong>Notes:</strong> ${options.params.notes}</p>` : ''}
          <p><a href="${options.params.view_url}">View Invoice Online</a></p>
        `,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (err: any) {
      this.logger.error(`SMTP delivery failed: ${err.message}`);
      throw new BadGatewayException('SMTP email delivery failed.');
    }
  }
}
