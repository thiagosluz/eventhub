import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Delete,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Request, Response } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../auth/roles.types";
import { CheckinService } from "./checkin.service";

interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

@Controller()
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @UseGuards(JwtAuthGuard)
  @Get("tickets/:id/qrcode")
  async getTicketQrCode(
    @Param("id") id: string,
    @Req() req: AuthRequest,
    @Res() res: Response,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error("Missing user id on token payload.");
    }

    const png = await this.checkinService.getQrCodePng(id, userId);
    res.setHeader("Content-Type", "image/png");
    res.send(png);
  }

  @UseGuards(JwtAuthGuard)
  @Post("checkin")
  async checkin(@Body() body: { qrCodeToken: string; activityId?: string }) {
    return this.checkinService.checkin({
      qrCodeToken: body.qrCodeToken,
      activityId: body.activityId,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post("raffles")
  async drawRaffle(
    @Body() body: { eventId: string; activityId?: string; count?: number },
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Missing tenantId on token payload.");
    }

    return this.checkinService.drawRaffle({
      tenantId,
      eventId: body.eventId,
      activityId: body.activityId,
      count: body.count ?? 1,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete("checkin/:id")
  async undoCheckin(@Param("id") id: string) {
    return this.checkinService.undoCheckin(id);
  }
}
