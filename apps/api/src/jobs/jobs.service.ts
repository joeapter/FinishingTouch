import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { createJobSchema } from '@finishing-touch/shared';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { parseWithSchema } from '../common/zod';

const listJobsSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

const updateJobSchema = createJobSchema.partial();

const assignmentSchema = z.object({
  employeeIds: z.array(z.string()).min(1),
});

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: unknown) {
    const data = parseWithSchema(createJobSchema, payload);

    return this.prisma.job.create({
      data: {
        title: data.title,
        address: data.address,
        startDateTime: new Date(data.startDateTime),
        endDateTime: new Date(data.endDateTime),
        estimateId: data.estimateId,
        assignments: {
          create: data.employeeIds.map((employeeId) => ({
            employeeId,
          })),
        },
      },
      include: {
        assignments: {
          include: {
            employee: true,
          },
        },
        estimate: true,
      },
    });
  }

  list(query: unknown) {
    const data = parseWithSchema(listJobsSchema, query);

    return this.prisma.job.findMany({
      where: {
        startDateTime: {
          gte: data.from ? new Date(data.from) : undefined,
          lte: data.to ? new Date(data.to) : undefined,
        },
      },
      include: {
        assignments: {
          include: {
            employee: true,
          },
        },
        estimate: true,
      },
      orderBy: {
        startDateTime: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            employee: true,
          },
        },
        estimate: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async update(id: string, payload: unknown) {
    const data = parseWithSchema(updateJobSchema, payload);
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.update({
        where: { id },
        data: {
          title: data.title,
          address: data.address,
          startDateTime: data.startDateTime
            ? new Date(data.startDateTime)
            : undefined,
          endDateTime: data.endDateTime
            ? new Date(data.endDateTime)
            : undefined,
          estimateId: data.estimateId,
        },
      });

      if (data.employeeIds) {
        await tx.jobAssignment.deleteMany({ where: { jobId: id } });
        await tx.jobAssignment.createMany({
          data: data.employeeIds.map((employeeId) => ({
            jobId: id,
            employeeId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.job.findUniqueOrThrow({
        where: { id: job.id },
        include: {
          assignments: {
            include: {
              employee: true,
            },
          },
          estimate: true,
        },
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.job.delete({
      where: { id },
    });
  }

  async addAssignments(id: string, payload: unknown) {
    const data = parseWithSchema(assignmentSchema, payload);
    await this.findOne(id);

    await this.prisma.jobAssignment.createMany({
      data: data.employeeIds.map((employeeId) => ({
        jobId: id,
        employeeId,
      })),
      skipDuplicates: true,
    });

    return this.findOne(id);
  }

  async removeAssignment(id: string, assignmentId: string) {
    await this.findOne(id);

    return this.prisma.jobAssignment.delete({
      where: {
        id: assignmentId,
      },
    });
  }

  async createFromEstimate(estimateId: string, employeeIds: string[] = []) {
    const estimate = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
    });

    if (!estimate) {
      throw new NotFoundException('Estimate not found');
    }

    if (estimate.status !== 'ACCEPTED' && estimate.status !== 'INVOICED') {
      throw new BadRequestException(
        'Only accepted estimates can be converted to jobs',
      );
    }

    const startDate = new Date(estimate.movingDate);
    startDate.setHours(9, 0, 0, 0);

    const endDate = new Date(estimate.movingDate);
    endDate.setHours(17, 0, 0, 0);

    return this.prisma.job.create({
      data: {
        title: `Turnover Painting - ${estimate.customerName}`,
        address: estimate.customerJobAddress,
        startDateTime: startDate,
        endDateTime: endDate,
        estimateId: estimate.id,
        assignments: {
          create: employeeIds.map((employeeId) => ({
            employeeId,
          })),
        },
      },
      include: {
        assignments: {
          include: {
            employee: true,
          },
        },
        estimate: true,
      },
    });
  }
}
