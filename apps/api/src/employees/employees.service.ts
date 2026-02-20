import { Injectable, NotFoundException } from '@nestjs/common';
import { createEmployeeSchema } from '@finishing-touch/shared';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { parseWithSchema } from '../common/zod';

const updateEmployeeSchema = createEmployeeSchema.partial();

const timesheetQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  create(payload: unknown) {
    const data = parseWithSchema(createEmployeeSchema, payload);

    return this.prisma.employee.create({
      data,
      include: {
        user: true,
      },
    });
  }

  list() {
    return this.prisma.employee.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async update(id: string, payload: unknown) {
    const data = parseWithSchema(updateEmployeeSchema, payload);
    await this.findOne(id);

    return this.prisma.employee.update({
      where: { id },
      data,
      include: {
        user: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.employee.delete({
      where: { id },
    });
  }

  async getTimesheets(id: string, query: unknown) {
    await this.findOne(id);
    const data = parseWithSchema(timesheetQuerySchema, query);

    const entries = await this.prisma.timeEntry.findMany({
      where: {
        employeeId: id,
        clockIn: {
          gte: data.from ? new Date(data.from) : undefined,
          lte: data.to ? new Date(data.to) : undefined,
        },
      },
      orderBy: {
        clockIn: 'desc',
      },
    });

    const totalMinutes = entries.reduce(
      (sum, entry) => sum + (entry.durationMinutes || 0),
      0,
    );

    return {
      entries,
      totalMinutes,
    };
  }
}
