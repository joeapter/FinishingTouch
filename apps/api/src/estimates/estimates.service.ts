import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  calculateEstimatePricing,
  createEstimateSchema,
  estimateStatusSchema,
} from '@finishing-touch/shared';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { parseWithSchema } from '../common/zod';
import {
  extractSequenceNumber,
  formatEstimateNumber,
  formatInvoiceNumber,
} from '../common/numbering';
import { PdfService } from '../pdf/pdf.service';

const listEstimateQuerySchema = z.object({
  search: z.string().optional(),
  status: estimateStatusSchema.optional(),
});

const updateEstimateSchema = z.object({
  status: estimateStatusSchema.optional(),
  notes: z.string().optional(),
});

@Injectable()
export class EstimatesService {
  private readonly logger = new Logger(EstimatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
  ) {}

  private async getNextEstimateNumber(): Promise<string> {
    const lastEstimate = await this.prisma.estimate.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        number: true,
      },
    });

    const nextValue = extractSequenceNumber(lastEstimate?.number) + 1;
    return formatEstimateNumber(nextValue);
  }

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
    const data = parseWithSchema(createEstimateSchema, payload);
    const estimateNumber = await this.getNextEstimateNumber();

    const pricing = calculateEstimatePricing(data.rooms);

    const customer = await this.prisma.customer.upsert({
      where: { email: data.customer.email },
      create: {
        name: data.customer.name,
        email: data.customer.email,
        phone: data.customer.phone,
      },
      update: {
        name: data.customer.name,
        phone: data.customer.phone,
      },
    });

    return this.prisma.estimate.create({
      data: {
        number: estimateNumber,
        movingDate: new Date(data.movingDate),
        customerId: customer.id,
        customerName: data.customer.name,
        customerPhone: data.customer.phone,
        customerEmail: data.customer.email,
        customerJobAddress: data.customer.jobAddress,
        notes: data.notes,
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        total: pricing.total,
        currencySymbol: process.env.APP_CURRENCY_SYMBOL || '₪',
        lineItems: {
          create: pricing.lineItems.map((item) => ({
            description: item.description,
            qty: item.qty,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
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

  list(query: unknown) {
    const parsedQuery = parseWithSchema(listEstimateQuerySchema, query);

    return this.prisma.estimate.findMany({
      where: {
        status: parsedQuery.status,
        OR: parsedQuery.search
          ? [
              {
                customerName: {
                  contains: parsedQuery.search,
                  mode: 'insensitive',
                },
              },
              {
                number: {
                  contains: parsedQuery.search,
                  mode: 'insensitive',
                },
              },
            ]
          : undefined,
      },
      include: {
        lineItems: true,
        invoice: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const estimate = await this.prisma.estimate.findUnique({
      where: { id },
      include: {
        lineItems: true,
        invoice: true,
      },
    });

    if (!estimate) {
      throw new NotFoundException('Estimate not found');
    }

    return estimate;
  }

  async update(id: string, payload: unknown) {
    const data = parseWithSchema(updateEstimateSchema, payload);

    await this.findOne(id);

    return this.prisma.estimate.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.notes,
      },
      include: {
        lineItems: true,
        invoice: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.estimate.delete({
      where: { id },
    });
  }

  async send(id: string) {
    const estimate = await this.findOne(id);

    this.logger.log(
      `[DEV EMAIL] Sending estimate ${estimate.number} to ${estimate.customerEmail}`,
    );

    return {
      ok: true,
      message: 'Estimate sent (dev log only).',
    };
  }

  async convertToInvoice(id: string) {
    const estimate = await this.prisma.estimate.findUnique({
      where: { id },
      include: {
        lineItems: true,
        invoice: true,
      },
    });

    if (!estimate) {
      throw new NotFoundException('Estimate not found');
    }

    if (estimate.invoice) {
      return estimate.invoice;
    }

    if (estimate.status === 'DECLINED') {
      throw new BadRequestException('Declined estimates cannot be invoiced');
    }

    const invoiceNumber = await this.getNextInvoiceNumber();

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          number: invoiceNumber,
          status: 'DRAFT',
          derivedFromEstimateId: estimate.id,
          subtotal: estimate.subtotal,
          tax: estimate.tax,
          total: estimate.total,
          currencySymbol: estimate.currencySymbol,
          customerName: estimate.customerName,
          customerPhone: estimate.customerPhone,
          customerEmail: estimate.customerEmail,
          customerJobAddress: estimate.customerJobAddress,
          lineItems: {
            create: estimate.lineItems.map((item) => ({
              description: item.description,
              qty: item.qty,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              metadata:
                item.metadata === null
                  ? undefined
                  : (item.metadata as Prisma.InputJsonValue),
            })),
          },
        },
      });

      await tx.estimate.update({
        where: { id: estimate.id },
        data: {
          status: 'INVOICED',
        },
      });

      return invoice;
    });
  }

  async generatePdf(id: string) {
    const estimate = await this.prisma.estimate.findUnique({
      where: { id },
      include: {
        lineItems: true,
      },
    });

    if (!estimate) {
      throw new NotFoundException('Estimate not found');
    }

    return this.pdfService.generateEstimatePdf({
      number: estimate.number,
      movingDate: estimate.movingDate,
      customerName: estimate.customerName,
      customerJobAddress: estimate.customerJobAddress,
      customerPhone: estimate.customerPhone,
      customerEmail: estimate.customerEmail,
      currencySymbol: estimate.currencySymbol,
      subtotal: estimate.subtotal,
      tax: estimate.tax,
      total: estimate.total,
      lineItems: estimate.lineItems,
    });
  }
}
