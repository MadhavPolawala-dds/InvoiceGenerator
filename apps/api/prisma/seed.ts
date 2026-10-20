import { PrismaClient, InvoiceStatus } from '@prisma/client';
import { calculateInvoice } from '@invoice/invoice-core';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding fictional invoices...');

  // Clean existing seed data
  await prisma.emailLog.deleteMany({});
  await prisma.lineItem.deleteMany({});
  await prisma.invoice.deleteMany({});

  // Invoice 1: Mandatory Check Case (2 x $50.00, $10.00 discount, 10% tax = $99.00)
  const lines1 = [
    {
      position: 0,
      description: 'Custom API Integration & Configuration',
      quantityMilli: 2000, // 2.000
      unitPriceCents: 5000, // $50.00
    },
  ];
  const totals1 = calculateInvoice({
    lines: lines1,
    discountCents: 1000, // $10.00
    taxRateBp: 1000,     // 10.00%
  });

  const invoice1 = await prisma.invoice.create({
    data: {
      number: 'INV-2026-001',
      status: InvoiceStatus.DRAFT,
      currency: 'USD',
      issueDate: new Date('2026-10-20'),
      dueDate: new Date('2026-11-20'),
      businessName: 'Apex Software Labs LLC',
      businessEmail: 'billing@apexlabs.example.com',
      businessAddress: '100 Innovation Way, Suite 400, Austin, TX 78701',
      customerName: 'Acme Retail Solutions',
      customerEmail: 'ap@acmeretail.example.com',
      customerAddress: '500 Commerce Blvd, Seattle, WA 98101',
      notes: 'Standard Net 30 terms. Thank you for your partnership.',
      discountCents: totals1.discountCents,
      taxRateBp: totals1.taxRateBp,
      subtotalCents: totals1.subtotalCents,
      taxCents: totals1.taxCents,
      totalCents: totals1.totalCents,
      customFields: [
        { id: 'cf-1', label: 'PO Number', value: 'PO-77892', visible: true, position: 0 },
        { id: 'cf-2', label: 'Internal Project Code', value: 'PRJ-ALPHA', visible: false, position: 1 },
      ],
      lineItems: {
        create: lines1.map((item, idx) => ({
          position: item.position,
          description: item.description,
          quantityMilli: item.quantityMilli,
          unitPriceCents: item.unitPriceCents,
          lineTotalCents: totals1.lineTotalsCents[idx],
        })),
      },
    },
  });

  // Invoice 2: Multi-line fractional invoice (3 x $19.99 and 1.5 x $0.33, discount $5, tax 8.25% = $60.05)
  const lines2 = [
    {
      position: 0,
      description: 'Cloud Infrastructure Consulting',
      quantityMilli: 3000, // 3.000
      unitPriceCents: 1999, // $19.99
    },
    {
      position: 1,
      description: 'Automated Testing Bandwidth',
      quantityMilli: 1500, // 1.500
      unitPriceCents: 33,   // $0.33
    },
  ];
  const totals2 = calculateInvoice({
    lines: lines2,
    discountCents: 500, // $5.00
    taxRateBp: 825,     // 8.25%
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      number: 'INV-2026-002',
      status: InvoiceStatus.SENT,
      currency: 'USD',
      issueDate: new Date('2026-10-15'),
      dueDate: new Date('2026-11-15'),
      sentAt: new Date('2026-10-15T14:30:00.000Z'),
      businessName: 'Apex Software Labs LLC',
      businessEmail: 'billing@apexlabs.example.com',
      businessAddress: '100 Innovation Way, Suite 400, Austin, TX 78701',
      customerName: 'Starlight Digital Media',
      customerEmail: 'finance@starlight.example.com',
      customerAddress: '750 Market Street, San Francisco, CA 94103',
      notes: 'Wire transfer instructions included in customer agreement.',
      discountCents: totals2.discountCents,
      taxRateBp: totals2.taxRateBp,
      subtotalCents: totals2.subtotalCents,
      taxCents: totals2.taxCents,
      totalCents: totals2.totalCents,
      customFields: [
        { id: 'cf-3', label: 'Contract Reference', value: 'MSA-2026-B', visible: true, position: 0 },
      ],
      lineItems: {
        create: lines2.map((item, idx) => ({
          position: item.position,
          description: item.description,
          quantityMilli: item.quantityMilli,
          unitPriceCents: item.unitPriceCents,
          lineTotalCents: totals2.lineTotalsCents[idx],
        })),
      },
    },
  });

  console.log(`Successfully seeded 2 fictional invoices:
- ${invoice1.number}: Total $${(invoice1.totalCents / 100).toFixed(2)} (Check Case)
- ${invoice2.number}: Total $${(invoice2.totalCents / 100).toFixed(2)}`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
