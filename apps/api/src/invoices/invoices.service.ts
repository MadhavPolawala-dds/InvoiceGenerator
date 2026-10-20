import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { calculateInvoice, validateDates } from '@invoice/invoice-core';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInvoiceDto) {
    // 1. Check duplicate invoice number
    const existing = await this.prisma.invoice.findUnique({
      where: { number: dto.number.trim() },
    });
    if (existing) {
      throw new ConflictException('This invoice number is already used.');
    }

    // 2. Validate dates
    const dateCheck = validateDates(dto.issueDate, dto.dueDate);
    if (dateCheck.dueDateError) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: [{ field: 'dueDate', message: dateCheck.dueDateError }],
      });
    }

    // 3. Recompute totals using invoice-core (ignore any totals client sent)
    const lines = dto.lineItems || [];
    let totals;
    try {
      totals = calculateInvoice({
        lines: lines.map((l) => ({
          quantityMilli: l.quantityMilli,
          unitPriceCents: l.unitPriceCents,
        })),
        discountCents: dto.discountCents || 0,
        taxRateBp: dto.taxRateBp || 0,
      });
    } catch (err: any) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: [{ field: 'discountCents', message: err.message }],
      });
    }

    // 4. Save invoice and line items in Prisma
    return this.prisma.invoice.create({
      data: {
        number: dto.number.trim(),
        status: dto.status || InvoiceStatus.DRAFT,
        currency: 'USD',
        issueDate: new Date(dto.issueDate),
        dueDate: new Date(dto.dueDate),
        businessName: dto.businessName.trim(),
        businessEmail: dto.businessEmail?.trim() || null,
        businessAddress: dto.businessAddress?.trim() || null,
        customerName: dto.customerName.trim(),
        customerEmail: dto.customerEmail?.trim() || null,
        customerAddress: dto.customerAddress?.trim() || null,
        notes: dto.notes?.trim() || null,
        discountCents: totals.discountCents,
        taxRateBp: totals.taxRateBp,
        subtotalCents: totals.subtotalCents,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
        customFields: (dto.customFields as any) || [],
        lineItems: {
          create: lines.map((l, index) => ({
            position: l.position ?? index,
            description: l.description.trim(),
            quantityMilli: l.quantityMilli,
            unitPriceCents: l.unitPriceCents,
            lineTotalCents: totals.lineTotalsCents[index],
          })),
        },
      },
      include: {
        lineItems: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        lineItems: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        lineItems: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    // 1. Ensure invoice exists
    const existing = await this.prisma.invoice.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Invoice not found');
    }

    // 2. Check duplicate number if changed
    if (dto.number.trim() !== existing.number) {
      const duplicate = await this.prisma.invoice.findUnique({
        where: { number: dto.number.trim() },
      });
      if (duplicate) {
        throw new ConflictException('This invoice number is already used.');
      }
    }

    // 3. Validate dates
    const dateCheck = validateDates(dto.issueDate, dto.dueDate);
    if (dateCheck.dueDateError) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: [{ field: 'dueDate', message: dateCheck.dueDateError }],
      });
    }

    // 4. Recompute totals using invoice-core
    const lines = dto.lineItems || [];
    let totals;
    try {
      totals = calculateInvoice({
        lines: lines.map((l) => ({
          quantityMilli: l.quantityMilli,
          unitPriceCents: l.unitPriceCents,
        })),
        discountCents: dto.discountCents || 0,
        taxRateBp: dto.taxRateBp || 0,
      });
    } catch (err: any) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: [{ field: 'discountCents', message: err.message }],
      });
    }

    // 5. Replace line items inside a single Prisma transaction
    return this.prisma.$transaction(async (tx: any) => {
      // Delete existing line items
      await tx.lineItem.deleteMany({
        where: { invoiceId: id },
      });

      // Update invoice and insert new line items
      return tx.invoice.update({
        where: { id },
        data: {
          number: dto.number.trim(),
          status: dto.status || existing.status,
          currency: 'USD',
          issueDate: new Date(dto.issueDate),
          dueDate: new Date(dto.dueDate),
          businessName: dto.businessName.trim(),
          businessEmail: dto.businessEmail?.trim() || null,
          businessAddress: dto.businessAddress?.trim() || null,
          customerName: dto.customerName.trim(),
          customerEmail: dto.customerEmail?.trim() || null,
          customerAddress: dto.customerAddress?.trim() || null,
          notes: dto.notes?.trim() || null,
          discountCents: totals.discountCents,
          taxRateBp: totals.taxRateBp,
          subtotalCents: totals.subtotalCents,
          taxCents: totals.taxCents,
          totalCents: totals.totalCents,
          customFields: (dto.customFields as any) || [],
          lineItems: {
            create: lines.map((l, index) => ({
              position: l.position ?? index,
              description: l.description.trim(),
              quantityMilli: l.quantityMilli,
              unitPriceCents: l.unitPriceCents,
              lineTotalCents: totals.lineTotalsCents[index],
            })),
          },
        },
        include: {
          lineItems: {
            orderBy: { position: 'asc' },
          },
        },
      });
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.invoice.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Invoice not found');
    }

    await this.prisma.invoice.delete({
      where: { id },
    });
  }
}
