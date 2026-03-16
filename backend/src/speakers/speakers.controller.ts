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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Req() req: AuthRequest,
    @UploadedFile() file: any,
  ) {
    return this.speakersService.uploadAvatar(req.user!.tenantId, file);
  }

  // Speaker Roles
  @Post('roles')
  async createRole(@Req() req: AuthRequest, @Body('name') name: string) {
    return this.speakersService.createRole(req.user!.tenantId, name);
  }

  @Get('roles')
  async findAllRoles(@Req() req: AuthRequest) {
    return this.speakersService.findAllRoles(req.user!.tenantId);
  }

  @Delete('roles/:id')
  async removeRole(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.speakersService.removeRole(req.user!.tenantId, id);
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
