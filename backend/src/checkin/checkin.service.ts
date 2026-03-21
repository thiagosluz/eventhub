import {
  ForbiddenException,
  NotFoundException,
  Injectable,
} from "@nestjs/common";
import * as QRCode from "qrcode";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { BadgesService } from "../badges/badges.service";

@Injectable()
export class CheckinService {
  private hiddenRaffleIds = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly badgesService: BadgesService,
  ) {}

  async getQrCodePng(ticketId: string, userId: string): Promise<Buffer> {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId },
      include: { registration: true },
    });

    if (!ticket) {
      throw new NotFoundException("Ingresso não encontrado.");
    }

    if (ticket.registration.userId !== userId) {
      throw new ForbiddenException("Ingresso não pertence ao usuário.");
    }

    if (!ticket.qrCodeToken) {
      throw new NotFoundException("Ingresso sem token de QR Code.");
    }

    return QRCode.toBuffer(ticket.qrCodeToken, {
      type: "png",
      width: 256,
      margin: 2,
    });
  }

  async checkin(params: {
    qrCodeToken: string;
    activityId?: string;
  }): Promise<{ alreadyCheckedIn: boolean; attendanceId: string }> {
    const { qrCodeToken, activityId } = params;

    const ticket = await this.prisma.ticket.findUnique({
      where: { qrCodeToken, status: "COMPLETED" },
      include: { attendances: true },
    });

    if (!ticket) {
      throw new NotFoundException("Ingresso inválido ou não aprovado.");
    }

    if (activityId) {
      const activity = await this.prisma.activity.findUnique({
        where: { id: activityId },
      });
      if (!activity || activity.eventId !== ticket.eventId) {
        throw new NotFoundException("Atividade não pertence a este evento.");
      }

      if (activity.requiresEnrollment) {
        const enrollment = await this.prisma.activityEnrollment.findFirst({
          where: { activityId, registrationId: ticket.registrationId },
        });
        if (!enrollment) {
          throw new ForbiddenException(
            "Participante não está inscrito nesta atividade.",
          );
        }
      }
    }

    const existing = await this.prisma.attendance.findFirst({
      where: {
        ticketId: ticket.id,
        activityId: activityId || null,
      },
    });

    if (existing) {
      return { alreadyCheckedIn: true, attendanceId: existing.id };
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        ticketId: ticket.id,
        activityId: activityId ?? undefined,
      },
      include: {
        ticket: {
          include: {
            registration: {
              include: { user: true, event: true },
            },
          },
        },
      },
    });

    const user = attendance.ticket.registration.user;
    const event = attendance.ticket.registration.event;

    if (user.email) {
      await this.mailService.enqueue({
        to: user.email,
        subject: `Check-in Realizado: ${event.name}`,
        text: `Olá ${user.name},\n\nSeu check-in no evento "${event.name}" foi realizado com sucesso!\n\nAproveite o evento!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #10b981; border-radius: 12px;">
            <h1 style="color: #10b981;">Check-in Confirmado! ✅</h1>
            <p>Olá <strong>${user.name}</strong>,</p>
            <p>Seu check-in no evento <strong>${event.name}</strong> acaba de ser realizado.</p>
            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #10b981;">
              <p style="margin: 0; color: #065f46;"><strong>Presença confirmada em:</strong> ${new Date().toLocaleString("pt-BR")}</p>
            </div>
            <p>Desejamos que você tenha uma excelente experiência!</p>
          </div>
        `,
      });
    }

    // Trigger Badge Check for Check-in Streak and Activity Hours
    await this.badgesService.checkAndAwardBadge(
      user.id,
      event.id,
      "CHECKIN_STREAK",
    );
    await this.badgesService.checkAndAwardBadge(
      user.id,
      event.id,
      "ACTIVITY_HOURS",
    );

    return { alreadyCheckedIn: false, attendanceId: attendance.id };
  }

  async drawRaffle(params: {
    tenantId: string;
    eventId: string;
    activityId?: string;
    count?: number;
    rule?: "ALL_REGISTERED" | "ONLY_CHECKED_IN";
    prizeName?: string;
    uniqueWinners?: boolean;
    excludeStaff?: boolean;
  }): Promise<{ winners: { registrationId: string; userName: string }[] }> {
    const {
      tenantId,
      eventId,
      activityId,
      count = 1,
      rule = "ONLY_CHECKED_IN",
      prizeName,
      uniqueWinners,
      excludeStaff,
    } = params;

    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });

    if (!event) {
      throw new ForbiddenException("Evento não pertence a este tenant.");
    }

    const byRegistration = new Map<
      string,
      { registrationId: string; userName: string; role: string }
    >();

    if (rule === "ONLY_CHECKED_IN") {
      const attendances = await this.prisma.attendance.findMany({
        where: {
          ticket: { eventId, status: "COMPLETED" },
          ...(activityId ? { activityId } : {}),
        },
        include: {
          ticket: {
            include: { registration: { include: { user: true } } },
          },
        },
      });

      for (const a of attendances) {
        const reg = a.ticket.registration;
        byRegistration.set(reg.id, {
          registrationId: reg.id,
          userName: reg.user.name,
          role: reg.user.role,
        });
      }
    } else {
      // ALL_REGISTERED
      if (activityId) {
        const enrollments = await this.prisma.activityEnrollment.findMany({
          where: { activityId, status: "CONFIRMED", registration: { eventId } },
          include: { registration: { include: { user: true } } },
        });
        for (const e of enrollments) {
          byRegistration.set(e.registrationId, {
            registrationId: e.registrationId,
            userName: e.registration.user.name,
            role: e.registration.user.role,
          });
        }
      } else {
        const tickets = await this.prisma.ticket.findMany({
          where: { eventId, status: "COMPLETED" },
          include: { registration: { include: { user: true } } },
        });
        for (const t of tickets) {
          byRegistration.set(t.registrationId, {
            registrationId: t.registrationId,
            userName: t.registration.user.name,
            role: t.registration.user.role,
          });
        }
      }
    }

    let validPool = Array.from(byRegistration.values());

    if (excludeStaff) {
      validPool = validPool.filter((p) => p.role !== "ORGANIZER");
    }

    if (uniqueWinners) {
      const pastWinners = await this.prisma.raffleHistory.findMany({
        where: { eventId },
        select: { registrationId: true },
      });
      const pastSet = new Set(pastWinners.map((w) => w.registrationId));
      validPool = validPool.filter((p) => !pastSet.has(p.registrationId));
    }

    if (validPool.length === 0) {
      return { winners: [] };
    }

    const drawCount = Math.min(count, validPool.length);
    const shuffled = [...validPool].sort(() => Math.random() - 0.5);
    const winners = shuffled.slice(0, drawCount);

    // Save history
    for (const w of winners) {
      await this.prisma.raffleHistory.create({
        data: {
          eventId,
          activityId: activityId || undefined,
          registrationId: w.registrationId,
          prizeName: prizeName || null,
          rule: rule as any,
        },
      });
    }

    return { winners };
  }

  async getEventRaffleHistory(tenantId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event)
      throw new ForbiddenException("Evento não pertence a este tenant.");

    const history = await this.prisma.raffleHistory.findMany({
      where: { eventId },
      include: {
        registration: {
          include: { user: { select: { name: true, email: true } } },
        },
        activity: { select: { title: true } },
      },
      orderBy: { drawnAt: "desc" },
    });

    return history.map((h) => ({
      ...h,
      isHiddenOnDisplay: this.hiddenRaffleIds.has(h.id),
    }));
  }

  async setRaffleDisplayVisibility(
    tenantId: string,
    historyId: string,
    hide: boolean,
  ) {
    const history = await this.prisma.raffleHistory.findUnique({
      where: { id: historyId },
      include: { event: true },
    });
    if (!history) throw new NotFoundException("Histórico não encontrado.");
    if (history.event.tenantId !== tenantId)
      throw new ForbiddenException("Sem permissão.");

    if (hide) {
      this.hiddenRaffleIds.add(historyId);
    } else {
      this.hiddenRaffleIds.delete(historyId);
    }
  }

  async deleteRaffleHistory(tenantId: string, historyId: string) {
    const history = await this.prisma.raffleHistory.findUnique({
      where: { id: historyId },
      include: { event: true },
    });
    if (!history) throw new NotFoundException("Histórico não encontrado.");
    if (history.event.tenantId !== tenantId)
      throw new ForbiddenException("Sem permissão.");

    await this.prisma.raffleHistory.delete({ where: { id: historyId } });
  }

  async markPrizeReceived(
    tenantId: string,
    historyId: string,
    received: boolean,
  ) {
    const history = await this.prisma.raffleHistory.findUnique({
      where: { id: historyId },
      include: { event: true, registration: true },
    });
    if (!history) throw new NotFoundException("Histórico não encontrado.");
    if (history.event.tenantId !== tenantId)
      throw new ForbiddenException("Sem permissão.");

    const updated = await this.prisma.raffleHistory.update({
      where: { id: historyId },
      data: { hasReceived: received },
    });

    if (received) {
      await this.badgesService.checkAndAwardBadge(
        history.registration.userId,
        history.eventId,
        "RAFFLE_WINNER",
      );
    }

    return updated;
  }

  async undoCheckin(attendanceId: string): Promise<void> {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!attendance) {
      throw new NotFoundException("Registro de presença não encontrado.");
    }

    await this.prisma.attendance.delete({
      where: { id: attendanceId },
    });
  }
}
