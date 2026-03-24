import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { v4 as uuidv4 } from "uuid";

interface RegisterOrganizerInput {
  tenantName: string;
  tenantSlug: string;
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async registerOrganizer(input: RegisterOrganizerInput) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new UnauthorizedException("Email já está em uso.");
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: input.tenantName,
        slug: input.tenantSlug,
      },
    });

    const passwordHash = await argon2.hash(input.password);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        password: passwordHash,
        role: "ORGANIZER",
        tenantId: tenant.id,
      },
    });

    return this.createSession(user);
  }

  async registerParticipant(
    input: Omit<RegisterOrganizerInput, "tenantName" | "tenantSlug">,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new UnauthorizedException("Email já está em uso.");
    }

    const passwordHash = await argon2.hash(input.password);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: `Participant ${input.name}`,
        slug: `participant-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        password: passwordHash,
        role: "PARTICIPANT",
        tenantId: tenant.id,
      },
    });

    return this.createSession(user);
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { 
        tenant: true,
        speaker: { select: { id: true } }
      },
    });

    if (!user || !(await argon2.verify(user.password, input.password))) {
      throw new UnauthorizedException("Credenciais inválidas.");
    }

    return this.createSession(user);
  }

  async refresh(refreshToken: string) {
    const user = await this.prisma.user.findFirst({
      where: { refreshToken },
      include: {
        tenant: true,
        speaker: { select: { id: true } }
      }
    });

    if (!user) {
      throw new UnauthorizedException("Token de atualização inválido.");
    }

    return this.createSession(user);
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException("Usuário não encontrado.");
    }

    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      },
    });

    await this.mailService.enqueue({
      to: user.email,
      subject: "Recuperação de Senha - EventHub",
      text: `Utilize o token abaixo para resetar sua senha (válido por 1 hora):\n\n${token}`,
      html: `<p>Utilize o token abaixo para resetar sua senha (válido por 1 hora):</p><h3>${token}</h3>`,
    });
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException("Token inválido ou expirado.");
    }

    const passwordHash = await argon2.hash(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  }

  private async createSession(user: any) {
    const access_token = await this.generateToken(user, "15m");
    const refresh_token = await this.generateToken(user, "7d");

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refresh_token },
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        isSpeaker: !!user.speaker || user.role === "SPEAKER",
      },
    };
  }

  private async generateToken(user: any, expiresIn: string) {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      isSpeaker: !!user.speaker || user.role === "SPEAKER",
    };

    return this.jwtService.signAsync(payload, { expiresIn: expiresIn as any });
  }
}
