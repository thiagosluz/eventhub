import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  Request,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ApiOperation, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "./jwt-auth.guard";
import {
  ChangeForcedPasswordDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterOrganizerDto,
  RegisterParticipantDto,
  ResetPasswordDto,
} from "./dto/auth.dto";
import type { Request as ExpressRequest } from "express";

type SessionRequest = ExpressRequest & {
  user?: { sub: string; role?: string; email?: string };
};

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register-organizer")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: "Register a new organizer and tenant" })
  registerOrganizer(
    @Body() body: RegisterOrganizerDto,
    @Req() req: SessionRequest,
  ) {
    return this.authService.registerOrganizer(body, getRequestMeta(req));
  }

  @Post("register-participant")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: "Register a new participant (guest)" })
  registerParticipant(
    @Body() body: RegisterParticipantDto,
    @Req() req: SessionRequest,
  ) {
    return this.authService.registerParticipant(body, getRequestMeta(req));
  }

  @Post("login")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: "Authenticate and get JWT tokens" })
  login(@Body() body: LoginDto, @Req() req: SessionRequest) {
    return this.authService.login(body, getRequestMeta(req));
  }

  @Post("refresh")
  @Throttle({ default: { limit: 40, ttl: 60_000 } })
  @ApiOperation({ summary: "Refresh access token using refresh token" })
  refresh(@Body() body: RefreshTokenDto, @Req() req: SessionRequest) {
    return this.authService.refresh(body.refresh_token, getRequestMeta(req));
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout and revoke current refresh token" })
  logout(@Body() body: RefreshTokenDto, @Request() req: SessionRequest) {
    return this.authService.logout(req.user!.sub, body.refresh_token);
  }

  @Post("forgot-password")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: "Request password recovery token" })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post("reset-password")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: "Reset password using token" })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Post("change-password-forced")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Change password when mustChangePassword flag is true",
  })
  changeForcedPassword(
    @Body() body: ChangeForcedPasswordDto,
    @Request() req: SessionRequest,
  ) {
    return this.authService.changeForcedPassword(
      req.user!.sub,
      body.newPassword,
    );
  }

  @Post("change-password")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Change current user password" })
  changePassword(
    @Body() body: ChangePasswordDto,
    @Request() req: SessionRequest,
  ) {
    return this.authService.changePassword(
      req.user!.sub,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Post("2fa/generate")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Gera o secret e o QR Code do 2FA" })
  generateTwoFactorSecret(@Request() req: SessionRequest) {
    if (req.user?.role !== "SUPER_ADMIN") {
      throw new UnauthorizedException(
        "Apenas o superadmin pode habilitar 2FA no momento.",
      );
    }
    return this.authService.setupTwoFactorAuthentication(
      req.user!.sub,
      req.user!.email || "admin@eventhub",
    );
  }

  @Post("2fa/turn-on")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Verifica e ativa o 2FA" })
  turnOnTwoFactorAuth(
    @Body() body: { code: string },
    @Request() req: SessionRequest,
  ) {
    return this.authService.turnOnTwoFactorAuthentication(
      req.user!.sub,
      body.code,
    );
  }

  @Post("2fa/turn-off")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Desativa o 2FA para o usuário" })
  turnOffTwoFactorAuthentication(
    @Body() body: { code: string },
    @Request() req: SessionRequest,
  ) {
    return this.authService.turnOffTwoFactorAuthentication(
      req.user!.sub,
      body.code,
    );
  }

  @Post("2fa/recovery-codes/regenerate")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Regera os códigos de backup do 2FA" })
  regenerateRecoveryCodes(@Request() req: SessionRequest) {
    return this.authService.regenerateRecoveryCodes(req.user!.sub);
  }

  @Post("2fa/authenticate")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: "Finaliza o login utilizando o código do 2FA e o tempToken",
  })
  async authenticate2fa(
    @Body() body: { code: string; tempToken: string },
    @Req() req: SessionRequest,
  ) {
    return this.authService.verifyTempTokenAndLogin(
      body.tempToken,
      body.code,
      getRequestMeta(req),
    );
  }
}

function getRequestMeta(req: SessionRequest) {
  const userAgent =
    typeof req.headers["user-agent"] === "string"
      ? req.headers["user-agent"]
      : undefined;
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim()
      : undefined;
  return {
    userAgent,
    ip: forwardedIp || req.ip,
  };
}
