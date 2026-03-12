import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CheckoutService } from './checkout.service';

interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

class CheckoutDto {
  eventId!: string;
  activityIds?: string[];
}

@Controller()
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async checkoutFree(@Body() body: CheckoutDto, @Req() req: AuthRequest) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('Missing user id on token payload.');
    }

    const activityIds = body.activityIds ?? [];

    const result = await this.checkout.processCheckout({
      eventId: body.eventId,
      activityIds,
      userId,
    });

    return {
      registrationId: result.registrationId,
      tickets: result.payment.tickets,
      totalAmount: result.payment.totalAmount,
    };
  }
}

