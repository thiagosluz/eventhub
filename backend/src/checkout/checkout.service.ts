import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import { FreeTicketStrategy } from './free-ticket.strategy';
import { PaymentResult } from './payment-strategy.interface';

export interface FormResponseInput {
  formId: string;
  answers: { fieldId: string; value: string }[];
}

interface CheckoutInput {
  eventId: string;
  activityIds: string[];
  userId: string;
  formResponses?: FormResponseInput[];
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

    if (input.formResponses?.length) {
      for (const fr of input.formResponses) {
        const response = await this.prisma.customFormResponse.create({
          data: {
            formId: fr.formId,
            registrationId: registration.id,
          },
        });
        for (const a of fr.answers) {
          await this.prisma.customFormAnswer.create({
            data: {
              responseId: response.id,
              fieldId: a.fieldId,
              value: a.value,
            },
          });
        }
      }
    }

    return {
      registrationId: registration.id,
      payment,
    };
  }
}

