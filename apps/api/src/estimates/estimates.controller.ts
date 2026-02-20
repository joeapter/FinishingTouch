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
import { EstimatesService } from './estimates.service';

@ApiTags('estimates')
@ApiBearerAuth()
@Controller('estimates')
export class EstimatesController {
  constructor(private readonly estimatesService: EstimatesService) {}

  @Roles('ADMIN', 'MANAGER')
  @Post()
  create(@Body() payload: unknown) {
    return this.estimatesService.create(payload);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Get()
  list(@Query() query: Record<string, string>) {
    return this.estimatesService.list(query);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.estimatesService.findOne(id);
  }

  @Roles('ADMIN', 'MANAGER')
  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: unknown) {
    return this.estimatesService.update(id, payload);
  }

  @Roles('ADMIN', 'MANAGER')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.estimatesService.remove(id);
  }

  @Roles('ADMIN', 'MANAGER')
  @Post(':id/send')
  send(@Param('id') id: string) {
    return this.estimatesService.send(id);
  }

  @Roles('ADMIN', 'MANAGER')
  @Post(':id/convert-to-invoice')
  convertToInvoice(@Param('id') id: string) {
    return this.estimatesService.convertToInvoice(id);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Get(':id/pdf')
  async pdf(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const pdf = await this.estimatesService.generatePdf(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="estimate-${id}.pdf"`,
    );
    res.send(pdf);
  }
}
