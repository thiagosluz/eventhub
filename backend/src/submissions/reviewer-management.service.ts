import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import * as argon2 from "argon2";
import * as crypto from "crypto";
import { InvitationStatus } from "../generated/prisma";
import { ManualRegisterReviewerDto } from "./dto/manual-register-reviewer.dto";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";

@Injectable()
export class ReviewerManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async inviteReviewer(eventId: string, email: string, invitedById: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { tenant: true },
    });

    if (!event) throw new NotFoundException("Evento não encontrado");

    // Check if invitation already exists
    const existingInvite = await this.prisma.reviewerInvitation.findUnique({
      where: { eventId_email: { eventId, email } },
    });

    if (existingInvite && existingInvite.status === InvitationStatus.PENDING) {
      // Re-send or just throw error? Let's re-send by updating token and expiresAt
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    await this.prisma.reviewerInvitation.upsert({
      where: { eventId_email: { eventId, email } },
      create: {
        eventId,
        email,
        token,
        invitedById,
        expiresAt,
        status: InvitationStatus.PENDING,
      },
      update: {
        token,
        status: InvitationStatus.PENDING,
        expiresAt,
      },
    });

    // Send email (Mocked or real)
    const acceptUrl = `${process.env.FRONTEND_URL}/invitation/accept/${token}`;
    await this.mail.enqueue({
      to: email,
      subject: `Convite para Comitê Científico - ${event.name}`,
      text: `Você foi convidado para ser revisor no evento ${event.name}. Aceite o convite aqui: ${acceptUrl}`,
      html: `<p>Você foi convidado para ser revisor no evento <b>${event.name}</b>.</p>
             <p><a href="${acceptUrl}">Clique aqui para aceitar o convite e concluir seu cadastro.</a></p>`,
    });

    return { message: "Convite enviado com sucesso" };
  }

  async manualRegister(eventId: string, data: ManualRegisterReviewerDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) throw new NotFoundException("Evento não encontrado");

    // Check if user already exists
    let user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (user) {
      // If user exists, just add to event committee
      await this.prisma.eventReviewer.upsert({
        where: { eventId_userId: { eventId, userId: user.id } },
        create: { eventId, userId: user.id },
        update: {},
      });
      return {
        message: "Usuário já existia e foi adicionado ao comitê do evento",
      };
    }

    const hashedPassword = await argon2.hash(data.temporaryPassword);

    // Create user with mustChangePassword flag
    user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        tenantId: (event as any).tenantId, // Assuming event has tenantId
        role: "REVIEWER",
        mustChangePassword: true,
      },
    });

    // Add to event committee
    await this.prisma.eventReviewer.create({
      data: { eventId, userId: user.id },
    });

    return {
      message: "Revisor cadastrado manualmente com sucesso",
      userId: user.id,
    };
  }

  async acceptInvitation(data: AcceptInvitationDto) {
    const invite = await this.prisma.reviewerInvitation.findUnique({
      where: { token: data.token },
      include: { event: true },
    });

    if (!invite) throw new NotFoundException("Convite não encontrado");
    if (invite.status !== InvitationStatus.PENDING)
      throw new BadRequestException("Convite já processado");
    if (invite.expiresAt < new Date())
      throw new BadRequestException("Convite expirado");

    const hashedPassword = await argon2.hash(data.password);

    // Use transaction to create user, mark invite accepted and add to committee
    return await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: invite.email,
          name: data.name,
          password: hashedPassword,
          tenantId: (invite.event as any).tenantId,
          role: "REVIEWER",
        },
      });

      // Mark invitation as accepted
      await tx.reviewerInvitation.update({
        where: { id: invite.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedById: user.id,
        },
      });

      // Add to event committee
      await tx.eventReviewer.create({
        data: {
          eventId: invite.eventId,
          userId: user.id,
        },
      });

      return {
        message: "Cadastro concluído e convite aceito",
        userId: user.id,
      };
    });
  }

  async getInvitation(token: string) {
    const invite = await this.prisma.reviewerInvitation.findUnique({
      where: { token },
      select: {
        email: true,
        status: true,
        expiresAt: true,
        event: {
          select: { name: true },
        },
      },
    });

    if (!invite) throw new NotFoundException("Convite não encontrado");
    return invite;
  }
}
