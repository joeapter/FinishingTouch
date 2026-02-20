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
import { Roles } from '../common/decorators.roles';
import { EmployeesService } from './employees.service';

@ApiTags('employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Roles('ADMIN', 'MANAGER')
  @Post()
  create(@Body() payload: unknown) {
    return this.employeesService.create(payload);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Get()
  list() {
    return this.employeesService.list();
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Roles('ADMIN', 'MANAGER')
  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: unknown) {
    return this.employeesService.update(id, payload);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }

  @Roles('ADMIN', 'MANAGER')
  @Get(':id/timesheets')
  timesheets(@Param('id') id: string, @Query() query: Record<string, string>) {
    return this.employeesService.getTimesheets(id, query);
  }
}
