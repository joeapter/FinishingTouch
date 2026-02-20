import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  createTimeEntrySchema,
  punchClockSchema,
} from '@finishing-touch/shared';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { parseWithSchema } from '../common/zod';

const listTimeEntriesSchema = z.object({
  employeeId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  openOnly: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((value) => value === 'true'),
});

const updateTimeEntrySchema = z.object({
  clockOut: z.string().optional(),
});

const diffMinutes = (clockIn: Date, clockOut: Date): number => {
  return Math.max(
    0,
    Math.round((clockOut.getTime() - clockIn.getTime()) / 60000),
  );
};

@Injectable()
export class TimeEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: unknown) {
    const data = parseWithSchema(listTimeEntriesSchema, query);

    return this.prisma.timeEntry.findMany({
      where: {
        employeeId: data.employeeId,
        clockIn: {
          gte: data.from ? new Date(data.from) : undefined,
          lte: data.to ? new Date(data.to) : undefined,
        },
        clockOut: data.openOnly ? null : undefined,
      },
      include: {
        employee: true,
      },
      orderBy: {
        clockIn: 'desc',
      },
    });
  }

  async create(payload: unknown) {
    const data = parseWithSchema(createTimeEntrySchema, payload);

    const employee = await this.prisma.employee.findUnique({
      where: { id: data.employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const clockIn = data.clockIn ? new Date(data.clockIn) : new Date();
    const clockOut = data.clockOut ? new Date(data.clockOut) : undefined;

    return this.prisma.timeEntry.create({
      data: {
        employeeId: data.employeeId,
        clockIn,
        clockOut,
        durationMinutes: clockOut ? diffMinutes(clockIn, clockOut) : null,
      },
      include: {
        employee: true,
      },
    });
  }

  async update(id: string, payload: unknown) {
    const data = parseWithSchema(updateTimeEntrySchema, payload);

    const entry = await this.prisma.timeEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException('Time entry not found');
    }

    const clockOut = data.clockOut ? new Date(data.clockOut) : new Date();

    return this.prisma.timeEntry.update({
      where: { id },
      data: {
        clockOut,
        durationMinutes: diffMinutes(entry.clockIn, clockOut),
      },
      include: {
        employee: true,
      },
    });
  }

  async punch(payload: unknown) {
    const data = parseWithSchema(punchClockSchema, payload);

    const employee = await this.prisma.employee.findUnique({
      where: { id: data.employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (data.action === 'IN') {
      const openEntry = await this.prisma.timeEntry.findFirst({
        where: {
          employeeId: data.employeeId,
          clockOut: null,
        },
      });

      if (openEntry) {
        throw new BadRequestException('Employee is already clocked in');
      }

      return this.prisma.timeEntry.create({
        data: {
          employeeId: data.employeeId,
          clockIn: new Date(),
        },
        include: {
          employee: true,
        },
      });
    }

    const openEntry = await this.prisma.timeEntry.findFirst({
      where: {
        employeeId: data.employeeId,
        clockOut: null,
      },
      orderBy: {
        clockIn: 'desc',
      },
    });

    if (!openEntry) {
      throw new BadRequestException('No open clock-in entry found');
    }

    const now = new Date();

    return this.prisma.timeEntry.update({
      where: {
        id: openEntry.id,
      },
      data: {
        clockOut: now,
        durationMinutes: diffMinutes(openEntry.clockIn, now),
      },
      include: {
        employee: true,
      },
    });
  }

  clockedInEmployees() {
    return this.prisma.timeEntry.findMany({
      where: {
        clockOut: null,
      },
      include: {
        employee: true,
      },
      orderBy: {
        clockIn: 'desc',
      },
    });
  }
}
