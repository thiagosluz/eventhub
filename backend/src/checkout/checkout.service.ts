import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ActivitiesService } from "../activities/activities.service";
import { FreeTicketStrategy } from "./free-ticket.strategy";
import { PaymentResult } from "./payment-strategy.interface";

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

import { MailService } from "../mail/mail.service";
import { BadgesService } from "../badges/badges.service";

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activitiesService: ActivitiesService,
    private readonly freeTicketStrategy: FreeTicketStrategy,
    private readonly mailService: MailService,
    private readonly badgesService: BadgesService,
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
      throw new NotFoundException("Evento não encontrado.");
    }

    const existingRegistration = await this.prisma.registration.findFirst({
      where: {
        eventId,
        userId,
      },
    });

    if (existingRegistration) {
      throw new ConflictException(
        "Você já possui uma inscrição para este evento.",
      );
    }

    const registration = await this.prisma.registration.create({
      data: {
        eventId,
        userId,
      },
    });

    // Trigger Badge Check for Early Bird and Event Count
    await this.badgesService.checkAndAwardBadge(userId, eventId, 'EARLY_BIRD');
    await this.badgesService.checkAndAwardBadge(userId, eventId, 'EVENT_COUNT');

    // Auto-enroll in activities that don't require manual enrollment
    const autoEnrollActivities = await this.prisma.activity.findMany({
      where: {
        eventId,
        requiresEnrollment: false,
      },
    });

    if (autoEnrollActivities.length > 0) {
      await this.prisma.activityEnrollment.createMany({
        data: autoEnrollActivities.map((activity) => ({
          activityId: activity.id,
          registrationId: registration.id,
        })),
        skipDuplicates: true,
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

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.email) {
      await this.mailService.enqueue({
        to: user.email,
        subject: `Inscrição Confirmada: ${event.name}`,
        text: `Olá ${user.name || "Participante"},\n\nSua inscrição no evento "${event.name}" foi confirmada com sucesso!\n\nVocê pode acessar seus ingressos no dashboard do EventHub.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 12px;">
            <h1 style="color: #10b981;">Inscrição Confirmada!</h1>
            <p>Olá <strong>${user.name || "Participante"}</strong>,</p>
            <p>Sua inscrição no evento <strong>${event.name}</strong> foi realizada com sucesso.</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Evento:</strong> ${event.name}</p>
              <p style="margin: 5px 0 0 0;"><strong>Local:</strong> ${event.location || "A definir"}</p>
            </div>
            <p>Acesse seu painel para visualizar seus ingressos e QR Codes.</p>
            <a href="${process.env.FRONTEND_URL || "http://localhost:3001"}/dashboard/my-tickets" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px;">Ver Meus Ingressos</a>
          </div>
        `,
      });
    }

    return {
      registrationId: registration.id,
      payment,
    };
  }
}
