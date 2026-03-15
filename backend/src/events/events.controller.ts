import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../auth/roles.types';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtService } from '@nestjs/jwt';
import { MinioService } from '../storage/minio.service';

interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

@Controller()
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly minioService: MinioService,
    private readonly jwtService: JwtService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post('events')
  async createEvent(@Body() body: CreateEventDto, @Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new Error('Missing tenantId on token payload.');
    }

    try {
      return await this.eventsService.createEvent({
        tenantId,
        data: body,
      });
    } catch (error: any) {
      if (error.message?.includes('slug')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get('events')
  async listEvents(@Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new Error('Missing tenantId on token payload.');
    }

    return this.eventsService.listEventsForTenant(tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get('events/:id')
  async getEvent(@Param('id') id: string, @Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error('Missing tenantId on token payload.');
    }
    return this.eventsService.findEventById(tenantId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Patch('events/:id')
  async updateEvent(
    @Param('id') id: string,
    @Body() body: UpdateEventDto,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new Error('Missing tenantId on token payload.');
    }

    return this.eventsService.updateEvent({
      tenantId,
      eventId: id,
      data: body,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get('participants')
  async listParticipants(@Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error('Tenant missing');
    }
    return this.eventsService.listParticipants(tenantId, {});
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post('events/:id/banner')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBanner(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new Error('Missing tenantId on token payload.');
    }

    const objectName = `events/${id}/banner-${Date.now()}`;
    const url = await this.minioService.uploadObject({
      bucket: 'event-media',
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
  @Post('events/:id/logo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new Error('Missing tenantId on token payload.');
    }

    const objectName = `events/${id}/logo-${Date.now()}`;
    const url = await this.minioService.uploadObject({
      bucket: 'event-media',
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

  @Get('public/events')
  async listPublicEvents() {
    return this.eventsService.findAllPublic();
  }

  @Get('public/events/:slug')
  async getPublicEvent(@Param('slug') slug: string, @Req() req: Request) {
    // Optional auth extraction for preview mode
    let organizerTenantId: string | undefined;
    const authHeader = req.headers['authorization'];
    
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = this.jwtService.decode(token) as any;
        if (decoded && decoded.tenantId) {
          organizerTenantId = decoded.tenantId;
        }
      } catch (e) {
        // Ignore invalid tokens for public route
      }
    }

    return this.eventsService.findPublicBySlug(slug, organizerTenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-tickets')
  async getMyTickets(@Req() req: AuthRequest) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('Missing user id on token payload.');
    }
    return this.eventsService.findMyTickets(userId);
  }
}

