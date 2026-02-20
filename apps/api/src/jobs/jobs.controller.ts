import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { parseWithSchema } from '../common/zod';
import { Roles } from '../common/decorators.roles';
import { JobsService } from './jobs.service';

const createFromEstimateSchema = z.object({
  employeeIds: z.array(z.string()).default([]),
});

@ApiTags('jobs')
@ApiBearerAuth()
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Roles('ADMIN', 'MANAGER')
  @Post()
  create(@Body() payload: unknown) {
    return this.jobsService.create(payload);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Get()
  list(@Query() query: Record<string, string>) {
    return this.jobsService.list(query);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Roles('ADMIN', 'MANAGER')
  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: unknown) {
    return this.jobsService.update(id, payload);
  }

  @Roles('ADMIN', 'MANAGER')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }

  @Roles('ADMIN', 'MANAGER')
  @Post(':id/assignments')
  addAssignments(@Param('id') id: string, @Body() payload: unknown) {
    return this.jobsService.addAssignments(id, payload);
  }

  @Roles('ADMIN', 'MANAGER')
  @Delete(':id/assignments/:assignmentId')
  removeAssignment(
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.jobsService.removeAssignment(id, assignmentId);
  }

  @Roles('ADMIN', 'MANAGER')
  @Post('from-estimate/:estimateId')
  createFromEstimate(
    @Param('estimateId') estimateId: string,
    @Body() payload: unknown,
  ) {
    const data = parseWithSchema(createFromEstimateSchema, payload || {});
    return this.jobsService.createFromEstimate(estimateId, data.employeeIds);
  }
}
