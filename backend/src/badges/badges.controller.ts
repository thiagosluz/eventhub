import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { BadgesService } from './badges.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/roles.types';

@Controller('badges')
@UseGuards(JwtAuthGuard)
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get('my')
  getMyBadges(@Req() req: any) {
    return this.badgesService.getMyBadges(req.user.sub);
  }

  @Get('available')
  getAvailable(@Req() req: any) {
    return this.badgesService.getAvailableBadges(req.user.sub);
  }

  @Post('event/:eventId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORGANIZER)
  create(@Req() req: any, @Param('eventId') eventId: string, @Body() body: any) {
    return this.badgesService.createBadge(req.user.tenantId, eventId, body);
  }

  @Get('event/:eventId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORGANIZER)
  findAll(@Req() req: any, @Param('eventId') eventId: string) {
    return this.badgesService.getBadgesByEvent(req.user.tenantId, eventId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORGANIZER)
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.badgesService.updateBadge(req.user.tenantId, id, body);
  }

  @Post('claim/:id')
  claim(@Req() req: any, @Param('id') id: string, @Body('claimCode') claimCode: string) {
    return this.badgesService.claimBadge(req.user.sub, id, claimCode);
  }

  @Post(':id/award-scan')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORGANIZER)
  awardByScan(@Req() req: any, @Param('id') id: string, @Body('ticketToken') ticketToken: string) {
    return this.badgesService.awardBadgeByScan(req.user.tenantId, id, ticketToken);
  }

  @Get(':id/claim-codes')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORGANIZER)
  getClaimCodes(@Req() req: any, @Param('id') id: string) {
    return this.badgesService.getBadgeClaimCodes(req.user.tenantId, id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORGANIZER)
  remove(@Req() req: any, @Param('id') id: string) {
    return this.badgesService.deleteBadge(req.user.tenantId, id);
  }
}
