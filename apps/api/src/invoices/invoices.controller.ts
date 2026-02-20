import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators.roles';
import { InvoicesService } from './invoices.service';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Roles('ADMIN', 'MANAGER')
  @Post()
  create(@Body() payload: unknown) {
    return this.invoicesService.create(payload);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Get()
  list(@Query() query: { status?: string; search?: string }) {
    return this.invoicesService.list(query);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Roles('ADMIN', 'MANAGER')
  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: unknown) {
    return this.invoicesService.update(id, payload);
  }

  @Roles('ADMIN', 'MANAGER')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Get(':id/pdf')
  async pdf(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const pdf = await this.invoicesService.generatePdf(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="invoice-${id}.pdf"`,
    );
    res.send(pdf);
  }
}
