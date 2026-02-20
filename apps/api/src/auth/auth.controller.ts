import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators.public';
import { CurrentUser } from '../common/decorators.current-user';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() payload: unknown) {
    return this.authService.login(payload);
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: unknown) {
    return user;
  }
}
