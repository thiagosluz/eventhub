import { Body, Controller, Post, UseGuards, Request } from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "./jwt-auth.guard";

class RegisterOrganizerDto {
  @ApiProperty({ example: "Minha Organização" })
  tenantName!: string;
  @ApiProperty({ example: "minha-org" })
  tenantSlug!: string;
  @ApiProperty({ example: "Thiago Luz" })
  name!: string;
  @ApiProperty({ example: "thiago@example.com" })
  email!: string;
  @ApiProperty({ example: "password123" })
  password!: string;
}

class LoginDto {
  @ApiProperty({ example: "thiago@example.com" })
  email!: string;
  @ApiProperty({ example: "password123" })
  password!: string;
}

class RefreshTokenDto {
  @ApiProperty()
  refresh_token!: string;
}

class ForgotPasswordDto {
  @ApiProperty({ example: "thiago@example.com" })
  email!: string;
}

class ResetPasswordDto {
  @ApiProperty()
  token!: string;
  @ApiProperty({ example: "newpassword123" })
  newPassword!: string;
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register-organizer")
  @ApiOperation({ summary: "Register a new organizer and tenant" })
  registerOrganizer(@Body() body: RegisterOrganizerDto) {
    return this.authService.registerOrganizer(body);
  }

  @Post("register-participant")
  @ApiOperation({ summary: "Register a new participant (guest)" })
  registerParticipant(
    @Body() body: Omit<RegisterOrganizerDto, "tenantName" | "tenantSlug">,
  ) {
    return this.authService.registerParticipant(body);
  }

  @Post("login")
  @ApiOperation({ summary: "Authenticate and get JWT tokens" })
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post("refresh")
  @ApiOperation({ summary: "Refresh access token using refresh token" })
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refresh_token);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout and invalidate refresh token" })
  logout(@Request() req: any) {
    return this.authService.logout(req.user.sub);
  }

  @Post("forgot-password")
  @ApiOperation({ summary: "Request password recovery token" })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post("reset-password")
  @ApiOperation({ summary: "Reset password using token" })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}
