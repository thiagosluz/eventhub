import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../auth/roles.types";
import { FormsService } from "./forms.service";
import { Request } from "express";

interface AuthRequest extends Request {
  user?: {
    tenantId: string;
  };
}

@Controller("events/:eventId/registration-form")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ORGANIZER)
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  async getForm(@Param("eventId") eventId: string, @Req() req: AuthRequest) {
    return this.formsService.getRegistrationForm(req.user!.tenantId, eventId);
  }

  @Post()
  async saveForm(
    @Param("eventId") eventId: string,
    @Req() req: AuthRequest,
    @Body() data: any,
  ) {
    return this.formsService.saveRegistrationForm(
      req.user!.tenantId,
      eventId,
      data,
    );
  }
}
