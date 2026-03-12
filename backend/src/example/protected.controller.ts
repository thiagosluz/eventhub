import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../auth/roles.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('example')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProtectedExampleController {
  @Get('me-organizer')
  @Roles(UserRole.ORGANIZER)
  getMeOrganizer(@Req() req: Request) {
    return { user: req.user };
  }
}

