import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators.public';
import { Roles } from '../common/decorators.roles';
import { LeadsService } from './leads.service';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Public()
  @Post()
  create(@Body() payload: unknown) {
    return this.leadsService.create(payload);
  }

  @ApiBearerAuth()
  @Roles('ADMIN', 'MANAGER')
  @Get()
  list() {
    return this.leadsService.list();
  }
}
