import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { leadSchema } from '@finishing-touch/shared';
import { parseWithSchema } from '../common/zod';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(payload: unknown) {
    const data = parseWithSchema(leadSchema, payload);

    const lead = await this.prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        source: data.source,
        jobAddress: data.jobAddress,
        movingDate: data.movingDate ? new Date(data.movingDate) : undefined,
      },
    });

    this.logger.log(
      `[DEV EMAIL] New lead from ${lead.name} <${lead.email}> source=${lead.source}`,
    );

    return lead;
  }

  list() {
    return this.prisma.lead.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
