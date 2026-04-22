import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Query,
  Delete,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { imageUploadConfig } from "../common/upload/upload.config";
import { Request, Response } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../auth/roles.types";
import { EventsService } from "./events.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { JwtService } from "@nestjs/jwt";
import { MinioService } from "../storage/minio.service";
import { MonitorGuard } from "../auth/monitor.guard";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

@ApiTags("events")
@ApiBearerAuth()
@Controller()
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly minioService: MinioService,
    private readonly jwtService: JwtService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiOperation({ summary: "Create a new event (Organizer only)" })
  @Post("events")
  async createEvent(@Body() body: CreateEventDto, @Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new Error("Missing tenantId on token payload.");
    }

    try {
      return await this.eventsService.createEvent({
        tenantId,
        data: body,
      });
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get("events")
  async listEvents(@Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new Error("Missing tenantId on token payload.");
    }

    return this.eventsService.listEventsForTenant(tenantId);
  }

  @UseGuards(JwtAuthGuard, MonitorGuard)
  @Get("events/:id")
  async getEvent(@Param("id") id: string, @Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Missing tenantId on token payload.");
    }
    return this.eventsService.findEventById(tenantId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Patch("events/:id")
  async updateEvent(
    @Param("id") id: string,
    @Body() body: UpdateEventDto,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new Error("Missing tenantId on token payload.");
    }

    try {
      return await this.eventsService.updateEvent({
        tenantId,
        eventId: id,
        data: body,
      });
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Delete("events/:id")
  async deleteEvent(@Param("id") id: string, @Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Missing tenantId on token payload.");
    }

    return this.eventsService.deleteEvent(tenantId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post("events/:id/duplicate")
  async duplicateEvent(@Param("id") id: string, @Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Missing tenantId on token payload.");
    }

    try {
      return await this.eventsService.duplicateEvent(tenantId, id);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get("participants/export")
  async exportParticipants(
    @Req() req: AuthRequest,
    @Res() res: Response,
    @Query("eventId") eventId?: string,
    @Query("search") search?: string,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Tenant missing");
    }

    const participants = await this.eventsService.listParticipants(tenantId, {
      eventId,
      search,
    });

    const header = "Nome,Email,Evento,Ticket,Data de Inscrição\n";
    const rows = participants
      .map((p) => {
        const name = p.user.name.replace(/,/g, "");
        const email = p.user.email;
        const eventName = p.event.name.replace(/,/g, "");
        const ticketType = p.tickets[0]?.type || "N/A";
        const date = new Date(p.createdAt).toLocaleDateString("pt-BR");
        return `${name},${email},${eventName},${ticketType},${date}`;
      })
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=participantes.csv",
    );
    res.status(200).send(header + rows);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get("participants/:id")
  async getParticipantDetail(@Req() req: AuthRequest, @Param("id") id: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Tenant missing");
    }
    return this.eventsService.findParticipantDetail(tenantId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get("participants")
  async listParticipants(
    @Req() req: AuthRequest,
    @Query("eventId") eventId?: string,
    @Query("search") search?: string,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Tenant missing");
    }
    return this.eventsService.listParticipants(tenantId, { eventId, search });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiOperation({ summary: "Upload event banner" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
      },
    },
  })
  @Post("events/:id/banner")
  @UseInterceptors(FileInterceptor("file", imageUploadConfig))
  async uploadBanner(
    @Param("id") id: string,
    @UploadedFile() file: any,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new Error("Missing tenantId on token payload.");
    }

    const objectName = `events/${id}/banner-${Date.now()}`;
    const url = await this.minioService.uploadObject({
      bucket: "event-media",
      objectName,
      data: file.buffer,
      contentType: file.mimetype,
    });

    return this.eventsService.updateEvent({
      tenantId,
      eventId: id,
      data: { bannerUrl: url },
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post("events/:id/logo")
  @UseInterceptors(FileInterceptor("file", imageUploadConfig))
  async uploadLogo(
    @Param("id") id: string,
    @UploadedFile() file: any,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new Error("Missing tenantId on token payload.");
    }

    const objectName = `events/${id}/logo-${Date.now()}`;
    const url = await this.minioService.uploadObject({
      bucket: "event-media",
      objectName,
      data: file.buffer,
      contentType: file.mimetype,
    });

    return this.eventsService.updateEvent({
      tenantId,
      eventId: id,
      data: { logoUrl: url },
    });
  }

  @ApiOperation({ summary: "List all public events" })
  @Get("public/events")
  async listPublicEvents() {
    return this.eventsService.findAllPublic();
  }

  @Get("public/events/:slug")
  async getPublicEvent(@Param("slug") slug: string, @Req() req: Request) {
    // Optional auth extraction for preview mode
    let organizerTenantId: string | undefined;
    const authHeader = req.headers["authorization"];

    if (
      authHeader &&
      typeof authHeader === "string" &&
      authHeader.startsWith("Bearer ")
    ) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = this.jwtService.decode(token) as any;
        if (decoded && decoded.tenantId) {
          organizerTenantId = decoded.tenantId;
        }
      } catch {
        // Ignore invalid tokens for public route
      }
    }

    return this.eventsService.findPublicBySlug(slug, organizerTenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("my-tickets")
  async getMyTickets(@Req() req: AuthRequest) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error("Missing user id on token payload.");
    }
    return this.eventsService.findMyTickets(userId);
  }
}
