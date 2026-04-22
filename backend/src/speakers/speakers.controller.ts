import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { SpeakersService } from "./speakers.service";
import { CreateSpeakerDto } from "./dto/create-speaker.dto";
import { UpdateSpeakerDto } from "./dto/update-speaker.dto";
import { Request } from "express";

interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

@Controller("speakers")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SpeakersController {
  constructor(private readonly speakersService: SpeakersService) {}

  @Get("me")
  @Roles(UserRole.SPEAKER)
  async getMe(@Req() req: AuthRequest) {
    return this.speakersService.findByUserId(req.user!.sub);
  }

  @Get("me/activities")
  @Roles(UserRole.SPEAKER)
  async getMyActivities(@Req() req: AuthRequest) {
    const speaker = await this.speakersService.findByUserId(req.user!.sub);
    return this.speakersService.findActivities(speaker.id);
  }

  @Get("me/summary")
  @Roles(UserRole.SPEAKER)
  async getMySummary(@Req() req: AuthRequest) {
    const speaker = await this.speakersService.findByUserId(req.user!.sub);
    return this.speakersService.getSummary(speaker.id);
  }

  @Get("me/feedbacks")
  @Roles(UserRole.SPEAKER)
  async getMyFeedbacks(
    @Req() req: AuthRequest,
    @Query("activityId") activityId?: string,
    @Query("rating") rating?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const speaker = await this.speakersService.findByUserId(req.user!.sub);
    return this.speakersService.getFeedbacks(speaker.id, {
      activityId,
      rating: rating ? parseInt(rating) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  @Post("me/activities/:activityId/materials")
  @Roles(UserRole.SPEAKER)
  async addMaterial(
    @Req() req: AuthRequest,
    @Param("activityId") activityId: string,
    @Body() data: { title: string; fileUrl: string; fileType?: string },
  ) {
    // Validar se a atividade pertence ao palestrante
    const speaker = await this.speakersService.findByUserId(req.user!.sub);
    const activities = await this.speakersService.findActivities(speaker.id);
    const hasActivity = activities.some((a) => a.activityId === activityId);

    if (!hasActivity) {
      throw new Error(
        "Você não tem permissão para adicionar materiais a esta atividade.",
      );
    }

    return this.speakersService.addMaterial(activityId, data);
  }

  @Delete("me/activities/:activityId/materials/:materialId")
  @Roles(UserRole.SPEAKER)
  async removeMaterial(
    @Req() req: AuthRequest,
    @Param("activityId") activityId: string,
    @Param("materialId") materialId: string,
  ) {
    // Validar se a atividade pertence ao palestrante
    const speaker = await this.speakersService.findByUserId(req.user!.sub);
    const activities = await this.speakersService.findActivities(speaker.id);
    const hasActivity = activities.some((a) => a.activityId === activityId);

    if (!hasActivity) {
      throw new Error(
        "Você não tem permissão para remover materiais desta atividade.",
      );
    }

    return this.speakersService.removeMaterial(materialId);
  }

  @Post()
  @Roles(UserRole.ORGANIZER)
  async create(@Req() req: AuthRequest, @Body() data: CreateSpeakerDto) {
    return this.speakersService.create(req.user!.tenantId, data);
  }

  @Get()
  @Roles(UserRole.ORGANIZER)
  async findAll(@Req() req: AuthRequest) {
    return this.speakersService.findAll(req.user!.tenantId);
  }

  @Post("upload")
  @Roles(UserRole.ORGANIZER, UserRole.SPEAKER)
  @UseInterceptors(FileInterceptor("file", imageUploadConfig))
  async uploadFile(@Req() req: AuthRequest, @UploadedFile() file: any) {
    return this.speakersService.uploadAvatar(req.user!.tenantId, file);
  }

  // Speaker Roles
  @Post("roles")
  @Roles(UserRole.ORGANIZER)
  async createRole(@Req() req: AuthRequest, @Body("name") name: string) {
    return this.speakersService.createRole(req.user!.tenantId, name);
  }

  @Get("roles")
  @Roles(UserRole.ORGANIZER)
  async findAllRoles(@Req() req: AuthRequest) {
    return this.speakersService.findAllRoles(req.user!.tenantId);
  }

  @Delete("roles/:id")
  @Roles(UserRole.ORGANIZER)
  async removeRole(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.speakersService.removeRole(req.user!.tenantId, id);
  }

  @Get(":id")
  @Roles(UserRole.ORGANIZER)
  async findOne(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.speakersService.findOne(req.user!.tenantId, id);
  }

  @Patch(":id")
  @Roles(UserRole.ORGANIZER, UserRole.SPEAKER)
  async update(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() data: UpdateSpeakerDto,
  ) {
    let tenantId = req.user!.tenantId;

    // Se for palestrante, valida se o ID é dele mesmo e usa o tenantId do palestrante
    if (req.user!.role === UserRole.SPEAKER) {
      const speaker = await this.speakersService.findByUserId(req.user!.sub);
      if (speaker.id !== id) {
        throw new Error("Você só pode atualizar seu próprio perfil.");
      }
      tenantId = speaker.tenantId;
    }

    return this.speakersService.update(tenantId, id, data);
  }

  @Delete(":id")
  @Roles(UserRole.ORGANIZER)
  async remove(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.speakersService.remove(req.user!.tenantId, id);
  }
}
