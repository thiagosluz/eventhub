import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { imageUploadConfig } from "../common/upload/upload.config";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../auth/roles.types";
import { TenantsService } from "./tenants.service";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import { Request } from "express";

interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get("public/tenant")
  async getPublicTenant() {
    return this.tenantsService.getPublicTenant();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.SPEAKER, UserRole.REVIEWER)
  @Get("me")
  async getMe(@Req() req: AuthRequest) {
    return this.tenantsService.getTenant(req.user!.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Patch("me")
  async updateMe(@Req() req: AuthRequest, @Body() data: UpdateTenantDto) {
    return this.tenantsService.updateTenant(req.user!.tenantId, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post("me/logo")
  @UseInterceptors(FileInterceptor("file", imageUploadConfig))
  async uploadLogo(
    @Req() req: AuthRequest,
    @UploadedFile() file: { buffer: Buffer; mimetype: string },
  ) {
    return this.tenantsService.uploadLogo(req.user!.tenantId, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post("me/cover")
  @UseInterceptors(FileInterceptor("file", imageUploadConfig))
  async uploadCover(
    @Req() req: AuthRequest,
    @UploadedFile() file: { buffer: Buffer; mimetype: string },
  ) {
    return this.tenantsService.uploadCover(req.user!.tenantId, file);
  }
}
