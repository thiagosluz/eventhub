import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../auth/roles.types";
import { SubmissionConfigService } from "./submission-config.service";
import { UpdateSubmissionConfigDto } from "./dto/update-submission-config.dto";
import { CreateModalityDto } from "./dto/create-modality.dto";
import { CreateThematicAreaDto } from "./dto/create-thematic-area.dto";
import { CreateSubmissionRuleDto } from "./dto/create-submission-rule.dto";

interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

@Controller("events/:eventId/submissions")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ORGANIZER)
export class SubmissionConfigController {
  constructor(private readonly configService: SubmissionConfigService) {}

  @Get("config")
  async getConfig(@Param("eventId") eventId: string, @Req() req: AuthRequest) {
    return this.configService.getConfig(req.user!.tenantId, eventId);
  }

  @Patch("config")
  async updateConfig(
    @Param("eventId") eventId: string,
    @Body() body: UpdateSubmissionConfigDto,
    @Req() req: AuthRequest,
  ) {
    return this.configService.updateConfig(req.user!.tenantId, eventId, body);
  }

  // === Modalities ===

  @Post("modalities")
  @UseInterceptors(FileInterceptor("templateFile"))
  async createModality(
    @Param("eventId") eventId: string,
    @Body() body: CreateModalityDto,
    @UploadedFile() file: any,
    @Req() req: AuthRequest,
  ) {
    const templateFile = file
      ? { buffer: file.buffer, mimetype: file.mimetype }
      : undefined;

    return this.configService.createModality(
      req.user!.tenantId,
      eventId,
      body,
      templateFile,
    );
  }

  @Delete("modalities/:modalityId")
  async deleteModality(
    @Param("eventId") eventId: string,
    @Param("modalityId") modalityId: string,
    @Req() req: AuthRequest,
  ) {
    return this.configService.deleteModality(
      req.user!.tenantId,
      eventId,
      modalityId,
    );
  }

  // === Thematic Areas ===

  @Post("thematic-areas")
  async createThematicArea(
    @Param("eventId") eventId: string,
    @Body() body: CreateThematicAreaDto,
    @Req() req: AuthRequest,
  ) {
    return this.configService.createThematicArea(
      req.user!.tenantId,
      eventId,
      body,
    );
  }

  @Delete("thematic-areas/:areaId")
  async deleteThematicArea(
    @Param("eventId") eventId: string,
    @Param("areaId") areaId: string,
    @Req() req: AuthRequest,
  ) {
    return this.configService.deleteThematicArea(
      req.user!.tenantId,
      eventId,
      areaId,
    );
  }

  // === Submission Rules ===

  @Post("rules")
  @UseInterceptors(FileInterceptor("file"))
  async createRule(
    @Param("eventId") eventId: string,
    @Body() body: CreateSubmissionRuleDto,
    @UploadedFile() file: any,
    @Req() req: AuthRequest,
  ) {
    if (!file) {
      throw new Error("Arquivo PDF é obrigatório.");
    }

    return this.configService.createRule(req.user!.tenantId, eventId, body, {
      buffer: file.buffer,
      mimetype: file.mimetype,
    });
  }

  @Delete("rules/:ruleId")
  async deleteRule(
    @Param("eventId") eventId: string,
    @Param("ruleId") ruleId: string,
    @Req() req: AuthRequest,
  ) {
    return this.configService.deleteRule(req.user!.tenantId, eventId, ruleId);
  }
}
