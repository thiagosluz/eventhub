import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../auth/roles.types';
import { SpeakersService } from './speakers.service';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { Request } from 'express';

interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

@Controller('speakers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ORGANIZER)
export class SpeakersController {
  constructor(private readonly speakersService: SpeakersService) {}

  @Post()
  async create(@Req() req: AuthRequest, @Body() data: CreateSpeakerDto) {
    return this.speakersService.create(req.user!.tenantId, data);
  }

  @Get()
  async findAll(@Req() req: AuthRequest) {
    return this.speakersService.findAll(req.user!.tenantId);
  }

  @Get(':id')
  async findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.speakersService.findOne(req.user!.tenantId, id);
  }

  @Patch(':id')
  async update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() data: UpdateSpeakerDto,
  ) {
    return this.speakersService.update(req.user!.tenantId, id, data);
  }

  @Delete(':id')
  async remove(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.speakersService.remove(req.user!.tenantId, id);
  }
}
