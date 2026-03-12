import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import { FreeTicketStrategy } from './free-ticket.strategy';
import { PaymentResult } from './payment-strategy.interface';

interface CheckoutInput {
  eventId: string;
  activityIds: string[];
  userId: string;
}

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activitiesService: ActivitiesService,
    private readonly freeTicketStrategy: FreeTicketStrategy,
  ) {}

  async processCheckout(input: CheckoutInput): Promise<{
    registrationId: string;
    payment: PaymentResult;
  }> {
    const { eventId, activityIds, userId } = input;

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Evento não encontrado.');
    }

    let registration = await this.prisma.registration.findFirst({
      where: {
        eventId,
        userId,
      },
    });

    if (!registration) {
      registration = await this.prisma.registration.create({
        data: {
          eventId,
          userId,
        },
      });
    }

    for (const activityId of activityIds) {
      await this.activitiesService.enrollInActivity({
        userId,
        activityId,
      });
    }

    const payment = await this.freeTicketStrategy.process({
      userId,
      eventId,
      registrationId: registration.id,
      activityIds,
    });

    return {
      registrationId: registration.id,
      payment,
    };
  }
}

