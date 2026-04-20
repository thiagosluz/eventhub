import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSpeakerDto } from "./dto/create-speaker.dto";
import { UpdateSpeakerDto } from "./dto/update-speaker.dto";
import { MinioService } from "../storage/minio.service";
import { UserRole } from "../auth/roles.types";

@Injectable()
export class SpeakersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  async create(tenantId: string, data: CreateSpeakerDto) {
    const speaker = await this.prisma.speaker.create({
      data: {
        ...data,
        tenantId,
      },
    });

    if (data.userId) {
      await this.upgradeUserToSpeaker(data.userId);
    }

    return speaker;
  }

  async findAll(tenantId: string) {
    return this.prisma.speaker.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async findOne(tenantId: string, id: string) {
    const speaker = await this.prisma.speaker.findFirst({
      where: { id, tenantId },
    });

    if (!speaker) {
      throw new NotFoundException(`Speaker with ID ${id} not found.`);
    }

    return speaker;
  }

  async update(tenantId: string, id: string, data: UpdateSpeakerDto) {
    const existingSpeaker = await this.findOne(tenantId, id);

    // Se estiver desvinculando um usuário
    if (data.userId === null && existingSpeaker.userId) {
      await this.downgradeUserToParticipant(existingSpeaker.userId);
    }

    const updatedSpeaker = await this.prisma.speaker.update({
      where: { id },
      data,
    });

    // Synchronize to User Profile if linked
    if (existingSpeaker.userId) {
      const userSyncData: any = {};
      if (data.name) userSyncData.name = data.name;
      if (data.email) userSyncData.email = data.email;
      if (data.bio) userSyncData.bio = data.bio;
      if (data.avatarUrl) userSyncData.avatarUrl = data.avatarUrl;

      if (Object.keys(userSyncData).length > 0) {
        await this.prisma.user.update({
          where: { id: existingSpeaker.userId },
          data: userSyncData,
        });
      }
    }

    if (data.userId) {
      await this.upgradeUserToSpeaker(data.userId);
    }

    return updatedSpeaker;
  }

  private async upgradeUserToSpeaker(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user && user.role === UserRole.PARTICIPANT) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { role: UserRole.SPEAKER },
      });
    }
  }

  private async downgradeUserToParticipant(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user && user.role === UserRole.SPEAKER) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { role: UserRole.PARTICIPANT },
      });
    }
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.prisma.speaker.delete({
      where: { id },
    });
  }

  async uploadAvatar(
    tenantId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    const fileExt = file.originalname.split(".").pop();
    const fileName = `speakers/${tenantId}/${Date.now()}.${fileExt}`;

    const url = await this.minio.uploadObject({
      bucket: "eventhub",
      objectName: fileName,
      data: file.buffer,
      contentType: file.mimetype,
    });

    return { url };
  }

  // Speaker Roles
  async createRole(tenantId: string, name: string) {
    return this.prisma.speakerRole.create({
      data: { tenantId, name },
    });
  }

  async findAllRoles(tenantId: string) {
    return this.prisma.speakerRole.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async removeRole(tenantId: string, id: string) {
    const role = await this.prisma.speakerRole.findFirst({
      where: { id, tenantId },
    });
    if (!role) throw new NotFoundException("Role not found");
    return this.prisma.speakerRole.delete({ where: { id } });
  }

  // Speaker Portal Logic
  async findByUserId(userId: string) {
    const speaker = await this.prisma.speaker.findUnique({
      where: { userId },
    });
    if (!speaker)
      throw new NotFoundException(
        "Perfil de palestrante não encontrado para este usuário.",
      );
    return speaker;
  }

  async findActivities(speakerId: string) {
    return this.prisma.activitySpeaker.findMany({
      where: { speakerId },
      include: {
        activity: {
          include: {
            event: { select: { name: true, slug: true } },
            type: true,
            materials: { orderBy: { createdAt: "asc" } },
            _count: { select: { enrollments: true } },
          },
        },
        role: true,
      },
      orderBy: { activity: { startAt: "asc" } },
    });
  }

  async getSummary(speakerId: string) {
    const activities = await this.prisma.activitySpeaker.findMany({
      where: { speakerId },
      include: {
        activity: {
          select: {
            _count: { select: { enrollments: true } },
            feedbacks: { select: { rating: true } },
          },
        },
      },
    });

    let totalEnrollments = 0;
    let totalRatings = 0;
    let sumRatings = 0;
    const totalActivities = activities.length;

    activities.forEach((as) => {
      totalEnrollments += as.activity._count.enrollments;
      as.activity.feedbacks.forEach((f) => {
        totalRatings++;
        sumRatings += f.rating;
      });
    });

    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : null;

    return {
      totalActivities,
      totalEnrollments,
      averageRating,
    };
  }

  async getFeedbacks(
    speakerId: string,
    filters: {
      activityId?: string;
      rating?: number;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { activityId, rating, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    // Busca feedbacks de todas as atividades deste palestrante ou de uma específica
    const activityIds = activityId
      ? [activityId]
      : (
          await this.prisma.activitySpeaker.findMany({
            where: { speakerId },
            select: { activityId: true },
          })
        ).map((a) => a.activityId);

    const where = {
      activityId: { in: activityIds },
      ...(rating ? { rating } : {}),
    };

    const [data, total, aggregation] = await Promise.all([
      this.prisma.activityFeedback.findMany({
        where,
        include: {
          activity: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.activityFeedback.count({ where }),
      this.prisma.activityFeedback.aggregate({
        where,
        _avg: { rating: true },
      }),
    ]);

    return {
      data,
      total,
      averageRating: aggregation._avg.rating,
    };
  }

  async addMaterial(
    activityId: string,
    data: { title: string; fileUrl: string; fileType?: string },
  ) {
    return this.prisma.activityMaterial.create({
      data: {
        activityId,
        title: data.title,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
      },
    });
  }

  async removeMaterial(materialId: string) {
    return this.prisma.activityMaterial.delete({
      where: { id: materialId },
    });
  }
}
