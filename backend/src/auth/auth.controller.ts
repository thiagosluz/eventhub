import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ApiOperation, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "./jwt-auth.guard";
import {
  ChangeForcedPasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterOrganizerDto,
  RegisterParticipantDto,
  ResetPasswordDto,
} from "./dto/auth.dto";
import type { Request as ExpressRequest } from "express";

type SessionRequest = ExpressRequest & {
  user?: { sub: string };
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
