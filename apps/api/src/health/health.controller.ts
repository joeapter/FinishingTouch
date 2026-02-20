import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators.public';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
