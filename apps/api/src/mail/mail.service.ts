import {
  Injectable,
  NotFoundException,
  BadRequestException,
  BadGatewayException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendInvoiceDto } from './dto/send-invoice.dto';
import { MailDriver } from './mail.interface';
import { EmailJSDriver } from './drivers/emailjs.driver';
import { SmtpDriver } from './drivers/smtp.driver';
import { buildItemsHtml, buildCustomFieldsHtml } from './html-builder';
import { formatCurrency } from '@invoice/invoice-core';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private driver: MailDriver;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailJsDriver: EmailJSDriver,
    private readonly smtpDriver: SmtpDriver,
  ) {
    const driverType = process.env.MAIL_DRIVER || 'emailjs';
    this.driver = driverType === 'smtp' ? this.smtpDriver : this.emailJsDriver;
  }

  async sendInvoice(invoiceId: string, dto: SendInvoiceDto): Promise<{ status: string }> {
    // 1. Fetch invoice with line items
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        lineItems: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // 2. Validate line items for sending (must have at least 1)
    if (!invoice.lineItems || invoice.lineItems.length === 0) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: [{ field: 'lineItems', message: 'At least one line item is required to send.' }],
      });
    }

    // 3. Prepare parameters
    const publicAppUrl = process.env.PUBLIC_APP_URL || 'http://localhost:3000';
    const viewUrl = `${publicAppUrl}/invoices/${invoice.id}`;

    const itemsHtml = buildItemsHtml(invoice.lineItems);
    const customFieldsHtml = buildCustomFieldsHtml(invoice.customFields as any);

    const issueDateStr = invoice.issueDate.toISOString().split('T')[0];
    const dueDateStr = invoice.dueDate.toISOString().split('T')[0];

    const notesWithCustomMessage = dto.message
      ? `${dto.message}\n\n${invoice.notes || ''}`.trim()
      : invoice.notes || '';

    const subject = `Invoice ${invoice.number} from ${invoice.businessName}`;

    // 4. Send via selected driver
    try {
      await this.driver.send({
        to: dto.toEmail.trim(),
        subject,
        params: {
          to_email: dto.toEmail.trim(),
          to_name: invoice.customerName,
          invoice_number: invoice.number,
          business_name: invoice.businessName,
          issue_date: issueDateStr,
          due_date: dueDateStr,
          items_html: itemsHtml,
          subtotal: formatCurrency(invoice.subtotalCents),
          discount: formatCurrency(invoice.discountCents),
          tax: formatCurrency(invoice.taxCents),
          total: formatCurrency(invoice.totalCents),
          notes: notesWithCustomMessage,
          custom_fields_html: customFieldsHtml,
          view_url: viewUrl,
          reply_to: invoice.businessEmail || undefined,
        },
      });

      // 5. Update invoice state & log success
      await this.prisma.$transaction([
        this.prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: InvoiceStatus.SENT,
            sentAt: new Date(),
          },
        }),
        this.prisma.emailLog.create({
          data: {
            invoiceId: invoice.id,
            toEmail: dto.toEmail.trim(),
            status: 'SENT',
          },
        }),
      ]);

      return { status: 'sent' };
    } catch (err: any) {
      const safeError = err.message || 'Email delivery failed';
      this.logger.error(`Failed to send invoice ${invoice.number} to ${dto.toEmail}: ${safeError}`);

      // Log failure in EmailLog table
      await this.prisma.emailLog.create({
        data: {
          invoiceId: invoice.id,
          toEmail: dto.toEmail.trim(),
          status: 'FAILED',
          error: 'Email provider error during delivery',
        },
      }).catch((logErr) => {
        this.logger.error(`Failed to record email failure log: ${logErr.message}`);
      });

      throw new BadGatewayException(
        'Failed to deliver email through provider. Please check email provider configuration.',
      );
    }
  }
}
