import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  customerSnapshotSchema,
  invoiceStatusSchema,
} from '@finishing-touch/shared';
import { z } from 'zod';
import { parseWithSchema } from '../common/zod';
import { PrismaService } from '../prisma/prisma.service';
import {
  extractSequenceNumber,
  formatInvoiceNumber,
} from '../common/numbering';
import { PdfService } from '../pdf/pdf.service';

const lineItemSchema = z.object({
  description: z.string().min(1),
  qty: z.number().int().min(0),
  unitPrice: z.number().int().min(0),
  totalPrice: z.number().int().min(0),
  metadata: z.record(z.any()).optional(),
});

const createInvoiceSchema = z.object({
  derivedFromEstimateId: z.string().optional(),
  customer: customerSnapshotSchema,
  lineItems: z.array(lineItemSchema),
  subtotal: z.number().int().min(0),
  tax: z.number().int().min(0).default(0),
  total: z.number().int().min(0),
  currencySymbol: z.string().default('₪'),
});

const updateInvoiceSchema = z.object({
  status: invoiceStatusSchema.optional(),
});

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
  ) {}

  private async getNextInvoiceNumber(): Promise<string> {
    const lastInvoice = await this.prisma.invoice.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        number: true,
      },
    });

    const nextValue = extractSequenceNumber(lastInvoice?.number) + 1;
    return formatInvoiceNumber(nextValue);
  }

  async create(payload: unknown) {
    const data = parseWithSchema(createInvoiceSchema, payload);
    const invoiceNumber = await this.getNextInvoiceNumber();

    return this.prisma.invoice.create({
      data: {
        number: invoiceNumber,
        derivedFromEstimateId: data.derivedFromEstimateId,
        subtotal: data.subtotal,
        tax: data.tax,
        total: data.total,
        currencySymbol: data.currencySymbol,
        customerName: data.customer.name,
        customerPhone: data.customer.phone,
        customerEmail: data.customer.email,
        customerJobAddress: data.customer.jobAddress,
        lineItems: {
          create: data.lineItems.map((item) => ({
            ...item,
            metadata: item.metadata
              ? (item.metadata as Prisma.InputJsonValue)
              : undefined,
          })),
        },
      },
      include: {
        lineItems: true,
      },
    });
  }

  list(query: { status?: string; search?: string }) {
    const status = query.status
      ? parseWithSchema(invoiceStatusSchema, query.status)
      : undefined;

    return this.prisma.invoice.findMany({
      where: {
        status,
        OR: query.search
          ? [
              {
                number: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                customerName: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ]
          : undefined,
      },
      include: {
        lineItems: true,
        derivedFromEstimate: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        lineItems: true,
        derivedFromEstimate: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async update(id: string, payload: unknown) {
    const data = parseWithSchema(updateInvoiceSchema, payload);
    await this.findOne(id);

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: data.status,
      },
      include: {
        lineItems: true,
        derivedFromEstimate: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.invoice.delete({
      where: { id },
    });
  }

  async generatePdf(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        lineItems: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.pdfService.generateInvoicePdf({
      number: invoice.number,
      createdAt: invoice.createdAt,
      customerName: invoice.customerName,
      customerJobAddress: invoice.customerJobAddress,
      customerPhone: invoice.customerPhone,
      customerEmail: invoice.customerEmail,
      currencySymbol: invoice.currencySymbol,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      lineItems: invoice.lineItems,
    });
  }
}
