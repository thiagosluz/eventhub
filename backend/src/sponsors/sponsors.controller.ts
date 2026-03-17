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
import { SponsorsService } from "./sponsors.service";
import {
  CreateSponsorCategoryDto,
  UpdateSponsorCategoryDto,
} from "./dto/sponsor-category.dto";
import { CreateSponsorDto, UpdateSponsorDto } from "./dto/sponsor.dto";

interface AuthRequest extends Request {
  user?: { sub: string; email: string; tenantId: string; role: string };
}

@Controller("sponsors")
export class SponsorsController {
  constructor(private readonly sponsorsService: SponsorsService) {}

  // --- Categories ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post("categories/:eventId")
  async createCategory(
    @Param("eventId") eventId: string,
    @Body() dto: CreateSponsorCategoryDto,
    @Req() req: AuthRequest,
  ) {
    return this.sponsorsService.createCategory(
      req.user!.tenantId,
      eventId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get("categories/:eventId")
  async listCategories(
    @Param("eventId") eventId: string,
    @Req() req: AuthRequest,
  ) {
    return this.sponsorsService.listCategoriesByEvent(
      req.user!.tenantId,
      eventId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Patch("categories/:id")
  async updateCategory(
    @Param("id") id: string,
    @Body() dto: UpdateSponsorCategoryDto,
    @Req() req: AuthRequest,
  ) {
    return this.sponsorsService.updateCategory(req.user!.tenantId, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Delete("categories/:id")
  async deleteCategory(@Param("id") id: string, @Req() req: AuthRequest) {
    return this.sponsorsService.deleteCategory(req.user!.tenantId, id);
  }

  // --- Sponsors ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post()
  async createSponsor(@Body() dto: CreateSponsorDto, @Req() req: AuthRequest) {
    return this.sponsorsService.createSponsor(req.user!.tenantId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Patch(":id")
  async updateSponsor(
    @Param("id") id: string,
    @Body() dto: UpdateSponsorDto,
    @Req() req: AuthRequest,
  ) {
    return this.sponsorsService.updateSponsor(req.user!.tenantId, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Delete(":id")
  async deleteSponsor(@Param("id") id: string, @Req() req: AuthRequest) {
    return this.sponsorsService.deleteSponsor(req.user!.tenantId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post(":id/logo")
  @UseInterceptors(FileInterceptor("file"))
  async uploadLogo(
    @Param("id") id: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string },
    @Req() req: AuthRequest,
  ) {
    return this.sponsorsService.uploadLogo(req.user!.tenantId, id, file);
  }

  // --- Public ---

  @Get("public/event/:slug")
  async listPublicSponsors(@Param("slug") slug: string) {
    return this.sponsorsService.listPublicSponsorsByEventSlug(slug);
  }
}
