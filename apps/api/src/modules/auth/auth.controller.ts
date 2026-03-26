import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginEducatorDto } from './dto/login-educator.dto';
import { RegisterEducatorDto } from './dto/register-educator.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('educators/register')
  registerEducator(@Body() dto: RegisterEducatorDto) {
    return this.authService.register(dto);
  }

  @Post('educators/login')
  loginEducator(@Body() dto: LoginEducatorDto) {
    return this.authService.login(dto);
  }

  @Get('educators/me')
  me(@Headers('authorization') authorization?: string) {
    return this.authService.me(authorization);
  }

  @Post('educators/logout')
  logout(@Headers('authorization') authorization?: string) {
    return this.authService.logout(authorization);
  }
}
