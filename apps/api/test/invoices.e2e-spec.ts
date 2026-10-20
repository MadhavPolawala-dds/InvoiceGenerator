import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as supertest from 'supertest';
const request = (supertest as any).default || supertest;
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { createValidationPipe } from '../src/common/pipes/validation.pipe';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Invoices API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let createdInvoiceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(createValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Clean up created test invoices
    if (createdInvoiceId) {
      await prisma.invoice.deleteMany({
        where: { id: createdInvoiceId },
      });
    }
    await prisma.invoice.deleteMany({
      where: { number: { in: ['INV-TEST-001', 'INV-TEST-DUP', 'INV-TEST-FALSIFIED'] } },
    });
    await app.close();
  });

  it('1. GET /api/invoices - returns list of invoices (ordered newest first)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/invoices')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2); // From seed data
  });

  it('2. POST /api/invoices - creates a new invoice with status 201', async () => {
    const payload = {
      number: 'INV-TEST-001',
      issueDate: '2026-10-20',
      dueDate: '2026-11-20',
      businessName: 'Fictional Creative Agency',
      businessEmail: 'billing@creative.example.com',
      customerName: 'Enterprise Client Corp',
      customerEmail: 'ap@enterprise.example.com',
      notes: 'Payment via wire transfer',
      discountCents: 1000,
      taxRateBp: 1000,
      customFields: [
        { id: 'cf-test', label: 'PO Ref', value: 'PO-12345', visible: true, position: 0 },
      ],
      lineItems: [
        {
          position: 0,
          description: 'Custom Design System',
          quantityMilli: 2000, // 2.000
          unitPriceCents: 5000, // $50.00
        },
      ],
    };

    const res = await request(app.getHttpServer())
      .post('/api/invoices')
      .send(payload)
      .expect(201);

    expect(res.body.id).toBeDefined();
    createdInvoiceId = res.body.id;
    expect(res.body.number).toBe('INV-TEST-001');
    expect(res.body.subtotalCents).toBe(10000);
    expect(res.body.discountCents).toBe(1000);
    expect(res.body.taxCents).toBe(900);
    expect(res.body.totalCents).toBe(9900); // Check Case $99.00
    expect(res.body.lineItems).toHaveLength(1);
    expect(res.body.lineItems[0].lineTotalCents).toBe(10000);
  });

  it('3. POST /api/invoices with falsified totals - server recomputes and stores correct totals', async () => {
    // Client sends fake totals: subtotal 100, total 100
    const payloadWithFakeTotals = {
      number: 'INV-TEST-FALSIFIED',
      issueDate: '2026-10-20',
      dueDate: '2026-11-20',
      businessName: 'Fictional Tech Labs',
      customerName: 'Fictional Customer',
      discountCents: 1000, // $10.00
      taxRateBp: 1000,     // 10%
      subtotalCents: 100,  // FALSIFIED by client
      totalCents: 100,     // FALSIFIED by client
      lineItems: [
        {
          position: 0,
          description: 'Consulting Hours',
          quantityMilli: 2000,  // 2.000
          unitPriceCents: 5000, // $50.00
        },
      ],
    };

    const res = await request(app.getHttpServer())
      .post('/api/invoices')
      .send(payloadWithFakeTotals)
      .expect(201);

    // Verify server completely recomputed using invoice-core: 2 x $50 - $10 + 10% = $99.00
    expect(res.body.subtotalCents).toBe(10000);
    expect(res.body.totalCents).toBe(9900);
  });

  it('4. GET /api/invoices/:id - returns invoice by id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/invoices/${createdInvoiceId}`)
      .expect(200);

    expect(res.body.id).toBe(createdInvoiceId);
    expect(res.body.number).toBe('INV-TEST-001');
    expect(res.body.totalCents).toBe(9900);
  });

  it('5. PUT /api/invoices/:id - updates invoice and replaces line items transactionally', async () => {
    const updatePayload = {
      number: 'INV-TEST-001',
      issueDate: '2026-10-20',
      dueDate: '2026-11-25',
      businessName: 'Fictional Creative Agency Updated',
      customerName: 'Enterprise Client Corp',
      discountCents: 500, // $5.00
      taxRateBp: 825,     // 8.25%
      lineItems: [
        {
          position: 0,
          description: 'Item 1',
          quantityMilli: 3000, // 3
          unitPriceCents: 1999, // $19.99 -> 5997
        },
        {
          position: 1,
          description: 'Item 2',
          quantityMilli: 1500, // 1.5
          unitPriceCents: 33,   // $0.33 -> 50
        },
      ],
    };

    const res = await request(app.getHttpServer())
      .put(`/api/invoices/${createdInvoiceId}`)
      .send(updatePayload)
      .expect(200);

    expect(res.body.businessName).toBe('Fictional Creative Agency Updated');
    expect(res.body.subtotalCents).toBe(6047);
    expect(res.body.discountCents).toBe(500);
    expect(res.body.taxCents).toBe(458);
    expect(res.body.totalCents).toBe(6005);
    expect(res.body.lineItems).toHaveLength(2);
  });

  it('6. POST /api/invoices with duplicate number - returns 409 Conflict', async () => {
    const duplicatePayload = {
      number: 'INV-TEST-001', // already used
      issueDate: '2026-10-20',
      dueDate: '2026-11-20',
      businessName: 'Duplicate Agency',
      customerName: 'Client',
      lineItems: [
        {
          description: 'Service',
          quantityMilli: 1000,
          unitPriceCents: 1000,
        },
      ],
    };

    const res = await request(app.getHttpServer())
      .post('/api/invoices')
      .send(duplicatePayload)
      .expect(409);

    expect(res.body.statusCode).toBe(409);
    expect(res.body.message).toBe('This invoice number is already used.');
  });

  it('7. POST /api/invoices with bad payload - returns 400 with { statusCode, message: "Validation failed", errors: [{ field, message }] }', async () => {
    const badPayload = {
      number: '', // required
      issueDate: 'invalid-date',
      dueDate: '2026-10-10', // before issue date or invalid
      businessName: '',
      customerName: '',
      discountCents: -50,
      taxRateBp: 15000, // > 100%
      lineItems: [
        {
          description: '',
          quantityMilli: 0, // must be > 0
          unitPriceCents: -100, // negative
        },
      ],
    };

    const res = await request(app.getHttpServer())
      .post('/api/invoices')
      .send(badPayload)
      .expect(400);

    expect(res.body.statusCode).toBe(400);
    expect(res.body.message).toBe('Validation failed');
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);

    // Verify error shape has field and message
    res.body.errors.forEach((err: any) => {
      expect(err).toHaveProperty('field');
      expect(err).toHaveProperty('message');
    });
  });

  it('8. GET /api/invoices/:id with unknown id - returns 404 Not Found', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/invoices/00000000-0000-0000-0000-000000000000')
      .expect(404);

    expect(res.body.statusCode).toBe(404);
  });

  it('9. POST /api/invoices/:id/send with invalid email - returns 400 with validation error', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/invoices/${createdInvoiceId}/send`)
      .send({ toEmail: 'not-an-email' })
      .expect(400);

    expect(res.body.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'toEmail' })]),
    );
  });

  it('10. POST /api/invoices/:id/send with unknown id - returns 404', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/invoices/00000000-0000-0000-0000-000000000000/send')
      .send({ toEmail: 'client@example.com' })
      .expect(404);

    expect(res.body.statusCode).toBe(404);
  });

  it('11. DELETE /api/invoices/:id - removes invoice with status 204', async () => {
    await request(app.getHttpServer())
      .delete(`/api/invoices/${createdInvoiceId}`)
      .expect(204);

    // Verify subsequent GET returns 404
    await request(app.getHttpServer())
      .get(`/api/invoices/${createdInvoiceId}`)
      .expect(404);

    createdInvoiceId = '';
  });
});
