import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { createHash, randomUUID, randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { GamificationService } from "../gamification/gamification.service";
import { generateSecret, generateURI, verifySync } from "otplib";
import * as qrcode from "qrcode";

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

interface SessionMeta {
  userAgent?: string;
  ip?: string;
}

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string | null;
  mustChangePassword: boolean;
  isTwoFactorEnabled?: boolean;
  speaker?: { id: string } | null;
};

const REFRESH_TOKEN_TTL_DAYS = 7;

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly gamificationService: GamificationService,
  ) {}

  async registerOrganizer(
    input: RegisterOrganizerInput,
    meta: SessionMeta = {},
  ) {
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

    return this.createSession(user as SessionUser, meta);
  }

  async registerParticipant(
    input: Omit<RegisterOrganizerInput, "tenantName" | "tenantSlug">,
    meta: SessionMeta = {},
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

    return this.createSession(user as SessionUser, meta);
  }

  async login(input: LoginInput, meta: SessionMeta = {}) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: {
        tenant: true,
        speaker: { select: { id: true } },
      },
    });

    if (!user || !(await argon2.verify(user.password, input.password))) {
      throw new UnauthorizedException("Credenciais inválidas.");
    }

    if (user.role === 'SUPER_ADMIN' && user.isTwoFactorEnabled) {
      const payload = { sub: user.id, isTwoFactorAuthentication: true };
      const tempToken = this.jwtService.sign(payload, { expiresIn: '5m' });
      return { requires2fa: true, tempToken };
    }

    // Award Daily Login XP
    const dateStr = new Date().toISOString().split("T")[0];
    const xpAmount = await this.gamificationService.getXpForAction("DAILY_LOGIN");
    await this.gamificationService.awardXp(
      user.id,
      xpAmount,
      "DAILY_LOGIN",
      `DAILY_LOGIN_${user.id}_${dateStr}`
    );

    return this.createSession(user as unknown as SessionUser, meta);
  }

  async verifyTempTokenAndLogin(tempToken: string, code: string, meta: SessionMeta = {}) {
    try {
      const decoded = this.jwtService.verify(tempToken);
      if (!decoded.isTwoFactorAuthentication || !decoded.sub) {
        throw new UnauthorizedException("Token temporário inválido.");
      }
      return this.authenticate2fa(decoded.sub, code, meta);
    } catch (error) {
      throw new UnauthorizedException("Token temporário expirado ou inválido.");
    }
  }

  async authenticate2fa(userId: string, code: string, meta: SessionMeta = {}) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
        speaker: { select: { id: true } },
      },
    });

    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException("2FA não está ativado ou inválido para esta conta.");
    }

    let isCodeValid = false;
    let usedRecoveryCode: string | null = null;

    // Tenta validar como TOTP apenas se tiver 6 dígitos
    if (code.length === 6) {
      try {
        const result = verifySync({
          token: code,
          secret: user.twoFactorSecret,
        });
        isCodeValid = result.valid;
      } catch (err) {
        isCodeValid = false;
      }
    }

    // Se não for um TOTP válido, tenta validar como código de recuperação
    if (!isCodeValid && user.twoFactorRecoveryCodes.length > 0) {
      for (const hashedCode of user.twoFactorRecoveryCodes) {
        if (await argon2.verify(hashedCode, code.toUpperCase())) {
          isCodeValid = true;
          usedRecoveryCode = hashedCode;
          break;
        }
      }
    }

    if (!isCodeValid) {
      throw new UnauthorizedException("Código de autenticação inválido.");
    }

    if (usedRecoveryCode) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorRecoveryCodes: {
            set: user.twoFactorRecoveryCodes.filter((c) => c !== usedRecoveryCode),
          },
        },
      });
    }

    const dateStr = new Date().toISOString().split("T")[0];
    const xpAmount = await this.gamificationService.getXpForAction("DAILY_LOGIN");
    await this.gamificationService.awardXp(
      user.id,
      xpAmount,
      "DAILY_LOGIN",
      `DAILY_LOGIN_${user.id}_${dateStr}`
    );

    return this.createSession(user as unknown as SessionUser, meta);
  }

  async setupTwoFactorAuthentication(userId: string, email: string) {
    const secret = generateSecret();
    const appName = "EventHub";
    const otpauthUrl = generateURI({ issuer: appName, label: email, secret });

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    const qrCode = await qrcode.toDataURL(otpauthUrl);
    return { qrCode };
  }

  async turnOnTwoFactorAuthentication(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException("Chave 2FA não configurada.");
    }

    const result = verifySync({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!result.valid) {
      throw new UnauthorizedException("Código de autenticação inválido.");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: true },
    });

    const { plain, hashed } = await this.generateRecoveryCodes();
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorRecoveryCodes: { set: hashed } },
    });

    return { ok: true, recoveryCodes: plain };
  }

  async turnOffTwoFactorAuthentication(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user || !user.twoFactorSecret || !user.isTwoFactorEnabled) {
      throw new UnauthorizedException("2FA não está ativado.");
    }

    const result = verifySync({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!result.valid) {
      throw new UnauthorizedException("Código de autenticação inválido.");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: false, twoFactorSecret: null, twoFactorRecoveryCodes: { set: [] } },
    });

    return { ok: true };
  }
  async regenerateRecoveryCodes(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isTwoFactorEnabled) {
      throw new UnauthorizedException("2FA não está habilitado.");
    }

    const { plain, hashed } = await this.generateRecoveryCodes();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorRecoveryCodes: { set: hashed } },
    });

    return { recoveryCodes: plain };
  }

  private async generateRecoveryCodes(count = 10): Promise<{ plain: string[]; hashed: string[] }> {
    const plainCodes = Array.from({ length: count }, () => 
      randomBytes(5).toString('hex').toUpperCase()
    );
    const hashedCodes = await Promise.all(
      plainCodes.map(code => argon2.hash(code))
    );
    return { plain: plainCodes, hashed: hashedCodes };
  }

  async refresh(refreshToken: string, meta: SessionMeta = {}) {
    if (!refreshToken) {
      throw new UnauthorizedException("Token de atualização inválido.");
    }

    const tokenHash = hashRefreshToken(refreshToken);

    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            tenant: true,
            speaker: { select: { id: true } },
          },
        },
      },
    });

    if (
      !record ||
      record.revokedAt ||
      record.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException("Token de atualização inválido.");
    }

    // Rotate: revoke the current refresh token and issue a fresh session.
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    return this.createSession(record.user as unknown as SessionUser, meta);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = hashRefreshToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return { ok: true };
    }

    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException("Usuário não encontrado.");
    }

    const token = randomUUID();
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
        mustChangePassword: false,
      },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async changeForcedPassword(userId: string, newPassword: string) {
    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
        mustChangePassword: false,
      },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("Usuário não encontrado.");
    }

    const isPasswordValid = await argon2.verify(user.password, currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Senha atual incorreta.");
    }

    const passwordHash = await argon2.hash(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
      },
    });

    // Revogar todos os refresh tokens ativos
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }


  private async createSession(user: SessionUser, meta: SessionMeta = {}) {
    const access_token = await this.generateToken(user, "15m");
    const refresh_token = await this.generateToken(
      user,
      `${REFRESH_TOKEN_TTL_DAYS}d`,
    );

    const tokenHash = hashRefreshToken(refresh_token);
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        userAgent: meta.userAgent?.slice(0, 255),
        ip: meta.ip?.slice(0, 64),
      },
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
        mustChangePassword: user.mustChangePassword,
        isTwoFactorEnabled: !!user.isTwoFactorEnabled,
      },
    };
  }

  private async generateToken(user: SessionUser, expiresIn: string) {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      isSpeaker: !!user.speaker || user.role === "SPEAKER",
      mustChangePassword: user.mustChangePassword,
    };

    return this.jwtService.signAsync(payload, {
      expiresIn: expiresIn as never,
    });
  }
}
