import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

class RegisterOrganizerDto {
  tenantName!: string;
  tenantSlug!: string;
  name!: string;
  email!: string;
  password!: string;
}

class LoginDto {
  email!: string;
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-organizer')
  registerOrganizer(@Body() body: RegisterOrganizerDto) {
    return this.authService.registerOrganizer(body);
  }

  @Post('register-participant')
  registerParticipant(@Body() body: Omit<RegisterOrganizerDto, 'tenantName' | 'tenantSlug'>) {
    return this.authService.registerParticipant(body);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
}

