import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators.roles';
import { TimeEntriesService } from './time-entries.service';

@ApiTags('time-entries')
@ApiBearerAuth()
@Controller('time-entries')
export class TimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Get()
  list(@Query() query: Record<string, string>) {
    return this.timeEntriesService.list(query);
  }

  @Roles('ADMIN', 'MANAGER')
  @Post()
  create(@Body() payload: unknown) {
    return this.timeEntriesService.create(payload);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Post('punch')
  punch(@Body() payload: unknown) {
    return this.timeEntriesService.punch(payload);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Get('clocked-in/employees')
  clockedInEmployees() {
    return this.timeEntriesService.clockedInEmployees();
  }

  @Roles('ADMIN', 'MANAGER')
  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: unknown) {
    return this.timeEntriesService.update(id, payload);
  }
}
