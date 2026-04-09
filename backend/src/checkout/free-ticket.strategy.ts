import { randomUUID } from "crypto";
import { Injectable } from "@nestjs/common";
import { TicketStatus, TicketType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  PaymentContext,
  PaymentResult,
  PaymentStrategy,
} from "./payment-strategy.interface";

@Injectable()
export class FreeTicketStrategy implements PaymentStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async process(ctx: PaymentContext): Promise<PaymentResult> {
    const tickets = [];

    // Ticket principal do evento
    const eventTicket = await this.prisma.ticket.create({
      data: {
        eventId: ctx.eventId,
        registrationId: ctx.registrationId,
        type: "FREE",
        status: "COMPLETED",
        price: 0,
        qrCodeToken: randomUUID(),
      },
    });

    tickets.push(eventTicket);

    // Opcional: tickets por atividade (se quisermos granularidade futura)
    if (ctx.activityIds.length > 0) {
      for (const _activityId of ctx.activityIds) {
        const activityTicket = await this.prisma.ticket.create({
          data: {
            eventId: ctx.eventId,
            registrationId: ctx.registrationId,
            type: "FREE",
            status: "COMPLETED",
            price: 0,
            qrCodeToken: randomUUID(),
          },
        });
        tickets.push(activityTicket);
      }
    }

    return {
      tickets: tickets.map((t) => ({
        id: t.id,
        type: t.type as TicketType,
        status: t.status as TicketStatus,
        price: "0.00",
      })),
      totalAmount: "0.00",
    };
  }
}
