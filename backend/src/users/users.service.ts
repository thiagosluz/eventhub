import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateProfileDto, UpdatePasswordDto } from "./dto/update-user.dto";
import * as argon2 from "argon2";
import { MinioService } from "../storage/minio.service";
import { BadgesService } from "../badges/badges.service";
import { GamificationService } from "../gamification/gamification.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
    private readonly badgesService: BadgesService,
    private readonly gamificationService: GamificationService,
  ) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        bio: true,
        tenantId: true,
        username: true,
        interests: true,
        profileTheme: true,
        publicProfile: true,
        xp: true,
        coins: true,
        level: true,
      },
    });
    if (!user) throw new NotFoundException("Usuário não encontrado.");
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const userBefore = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        bio: true,
        username: true,
        avatarUrl: true,
        interests: true,
      },
    });

    if (!userBefore) throw new NotFoundException("Usuário não encontrado.");

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, id: { not: userId } },
      });
      if (existing) {
        throw new ConflictException(
          "Este e-mail já está em uso por outro usuário.",
        );
      }
    }

    if (dto.username) {
      const existing = await this.prisma.user.findFirst({
        where: { username: dto.username, id: { not: userId } },
      });
      if (existing) {
        throw new ConflictException(
          "Este username já está em uso por outro usuário.",
        );
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        bio: true,
        tenantId: true,
        username: true,
        interests: true,
        profileTheme: true,
        publicProfile: true,
        xp: true,
        coins: true,
        level: true,
      },
    });

    // Synchronize to Speaker Profile if exists
    await this.syncToSpeaker(userId, {
      name: updatedUser.name,
      email: updatedUser.email,
      bio: updatedUser.bio,
    });

    // Trigger Badge Check for Profile Completed
    await this.badgesService.checkAndAwardBadge(
      userId,
      null as any,
      "PROFILE_COMPLETED",
    );

    // Check for XP Award (Profile Completion)
    const isNowComplete = !!(
      updatedUser.name &&
      updatedUser.email &&
      updatedUser.bio &&
      updatedUser.username &&
      updatedUser.avatarUrl &&
      updatedUser.interests.length > 0
    );

    const wasAlreadyAwarded = await this.prisma.xpGainLog.findFirst({
      where: { userId, reason: "PROFILE_COMPLETED" },
    });

    let xpGain = 0;
    let isLevelUp = false;

    if (isNowComplete && !wasAlreadyAwarded) {
      const xpResult = await this.gamificationService.awardXp(
        userId,
        150,
        "PROFILE_COMPLETED",
        "PROFILE_COMPLETED",
      );
      xpGain = xpResult.xpGained;
      isLevelUp = xpResult.isLevelUp || false;
    }

    return {
      ...updatedUser,
      xpGained: xpGain,
      isLevelUp,
    };
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException("Usuário não encontrado.");

    const isMatch = await argon2.verify(user.password, dto.currentPassword);
    if (!isMatch) {
      throw new UnauthorizedException("A senha atual está incorreta.");
    }

    const newPasswordHash = await argon2.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: newPasswordHash },
    });

    return { message: "Senha atualizada com sucesso." };
  }

  async uploadAvatar(
    userId: string,
    file: { buffer: Buffer; mimetype: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException("Usuário não encontrado.");

    const objectName = `avatars/${userId}-${Date.now()}`;
    const url = await this.minio.uploadObject({
      bucket: "event-media",
      objectName,
      data: file.buffer,
      contentType: file.mimetype,
    });

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url },
      select: {
        id: true,
        avatarUrl: true,
      },
    });

    // Synchronize to Speaker Profile if exists
    await this.syncToSpeaker(userId, {
      avatarUrl: updatedUser.avatarUrl,
    });

    // Trigger Badge Check for Profile Completed
    await this.badgesService.checkAndAwardBadge(
      userId,
      null as any,
      "PROFILE_COMPLETED",
    );

    return updatedUser;
  }

  private async syncToSpeaker(userId: string, data: any) {
    const speaker = await this.prisma.speaker.findUnique({
      where: { userId },
    });
    if (speaker) {
      await this.prisma.speaker.update({
        where: { id: speaker.id },
        data,
      });
    }
  }

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { tenantId },
          {
            registrations: {
              some: {
                event: {
                  tenantId,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
      },
      orderBy: { name: "asc" },
    });
  }

  async findMyMonitoredEvents(userId: string) {
    return this.prisma.eventMonitor.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            startDate: true,
            endDate: true,
            bannerUrl: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username, publicProfile: true },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        bio: true,
        interests: true,
        profileTheme: true,
        xp: true,
        level: true,
        registrations: {
          where: { tickets: { some: { status: "COMPLETED" } } },
          include: {
            event: {
              select: {
                id: true,
                name: true,
                slug: true,
                bannerUrl: true,
              },
            },
          },
        },
        userBadges: {
          include: {
            badge: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("Perfil público não encontrado.");
    }

    return user;
  }

  async checkUsernameAvailability(username: string, excludeUserId?: string) {
    const existing = await this.prisma.user.findFirst({
      where: {
        username: { equals: username, mode: "insensitive" },
        id: excludeUserId ? { not: excludeUserId } : undefined,
      },
      select: { id: true },
    });
    return { available: !existing };
  }
}
