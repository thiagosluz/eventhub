import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { EnrollmentStatus } from "@prisma/client";
import { KanbanAutomationService } from "../kanban/kanban-automation.service";
import { GamificationService } from "../gamification/gamification.service";

@Injectable()
export class ActivitiesService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue("activities") private readonly activitiesQueue: Queue,
    private readonly kanbanAutomation: KanbanAutomationService,
    private readonly gamificationService: GamificationService,
  ) {}

  async onModuleInit() {
    await this.activitiesQueue.add(
      "cleanup-expired-enrollments",
      {},
      {
        repeat: {
          pattern: "0 0 * * *", // Run every night at midnight
        },
      },
    );
  }

  async createActivity(params: {
    tenantId: string;
    eventId: string;
    data: {
      title: string;
      description?: string;
      location?: string;
      startAt: string;
      endAt: string;
      capacity?: number;
      typeId?: string;
      requiresEnrollment?: boolean;
      requiresConfirmation?: boolean;
      confirmationDays?: number;
      speakers?: { speakerId: string; roleId?: string }[];
    };
  }) {
    const { tenantId, eventId, data } = params;

    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });

    if (!event) {
      throw new ForbiddenException("Evento não pertence a este tenant.");
    }

    const activity = await this.prisma.activity.create({
      data: {
        eventId,
        title: data.title,
        description: data.description,
        location: data.location,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        capacity: data.capacity,
        typeId: data.typeId,
        requiresEnrollment: data.requiresEnrollment || false,
        requiresConfirmation: data.requiresConfirmation || false,
        confirmationDays: data.confirmationDays,
      },
    });

    if (data.speakers && data.speakers.length > 0) {
      await this.prisma.activitySpeaker.createMany({
        data: data.speakers.map((s) => ({
          activityId: activity.id,
          speakerId: s.speakerId,
          roleId: s.roleId,
        })),
        skipDuplicates: true,
      });
    }

    await this.kanbanAutomation.handleActivityUpsert(activity.id);

    // Auto-enroll existing participants if enrollment is not required
    if (!activity.requiresEnrollment) {
      const registrations = await this.prisma.registration.findMany({
        where: { eventId },
        select: { id: true },
      });

      if (registrations.length > 0) {
        await this.prisma.activityEnrollment.createMany({
          data: registrations.map((r) => ({
            activityId: activity.id,
            registrationId: r.id,
          })),
          skipDuplicates: true,
        });
      }
    }

    return this.getActivityForTenant(tenantId, activity.id);
  }

  async listActivitiesForEvent(tenantId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });

    if (!event) {
      throw new ForbiddenException("Evento não pertence a este tenant.");
    }

    const activities = await this.prisma.activity.findMany({
      where: { eventId },
      include: {
        type: true,
        speakers: {
          include: {
            speaker: true,
            role: true,
          },
        },
        enrollments: true,
        materials: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { startAt: "asc" },
    });

    return activities.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      location: a.location,
      startAt: a.startAt,
      endAt: a.endAt,
      capacity: a.capacity,
      remainingSpots:
        a.capacity != null
          ? Math.max(a.capacity - a.enrollments.length, 0)
          : null,
      type: a.type ? { id: a.type.id, name: a.type.name } : null,
      requiresEnrollment: a.requiresEnrollment,
      requiresConfirmation: a.requiresConfirmation,
      confirmationDays: a.confirmationDays,
      materials: a.materials,
      speakers: a.speakers.map((as) => ({
        speaker: as.speaker,
        role: as.role ? { id: as.role.id, name: as.role.name } : null,
      })),
    }));
  }

  async getActivitiesForParticipant(params: {
    userId: string;
    eventId: string;
  }) {
    const { userId, eventId } = params;

    const activities = await this.prisma.activity.findMany({
      where: { eventId },
      include: {
        type: true,
        speakers: {
          include: {
            speaker: true,
            role: true,
          },
        },
        enrollments: {
          where: {
            registration: {
              userId,
            },
          },
        },
        materials: { orderBy: { createdAt: "asc" } },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { startAt: "asc" },
    });

    return activities.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      location: a.location,
      startAt: a.startAt,
      endAt: a.endAt,
      capacity: a.capacity,
      remainingSpots:
        a.capacity != null
          ? Math.max(a.capacity - a._count.enrollments, 0)
          : null,
      isEnrolled: a.enrollments.length > 0,
      enrollmentStatus: a.enrollments[0]?.status || null,
      requiresEnrollment: a.requiresEnrollment,
      requiresConfirmation: a.requiresConfirmation,
      confirmationDays: a.confirmationDays,
      materials: a.materials,
      type: a.type ? { id: a.type.id, name: a.type.name } : null,
      speakers: a.speakers.map((as) => ({
        speaker: as.speaker,
        role: as.role ? { id: as.role.id, name: as.role.name } : null,
      })),
    }));
  }

  async getActivityForTenant(tenantId: string, activityId: string) {
    const activity = await this.prisma.activity.findFirst({
      where: {
        id: activityId,
        event: { tenantId },
      },
      include: {
        speakers: {
          include: {
            speaker: true,
            role: true,
          },
        },
        type: true,
        enrollments: true,
      },
    });

    if (!activity) {
      throw new NotFoundException("Atividade não encontrada para este tenant.");
    }

    return {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      location: activity.location,
      startAt: activity.startAt,
      endAt: activity.endAt,
      capacity: activity.capacity,
      remainingSpots:
        activity.capacity != null
          ? Math.max(activity.capacity - activity.enrollments.length, 0)
          : null,
      speakers: activity.speakers.map((as) => ({
        speaker: as.speaker,
        role: as.role ? { id: as.role.id, name: as.role.name } : null,
      })),
      type: activity.type
        ? { id: activity.type.id, name: activity.type.name }
        : null,
      requiresEnrollment: activity.requiresEnrollment,
      requiresConfirmation: activity.requiresConfirmation,
      confirmationDays: activity.confirmationDays,
    };
  }

  async updateActivity(params: {
    tenantId: string;
    activityId: string;
    data: {
      title?: string;
      description?: string;
      location?: string;
      startAt?: string;
      endAt?: string;
      capacity?: number;
      typeId?: string;
      requiresEnrollment?: boolean;
      requiresConfirmation?: boolean;
      confirmationDays?: number;
      speakers?: { speakerId: string; roleId?: string }[];
    };
  }) {
    const { tenantId, activityId, data } = params;

    await this.getActivityForTenant(tenantId, activityId);

    const updateData: any = {
      title: data.title,
      description: data.description,
      location: data.location,
      startAt: data.startAt ? new Date(data.startAt) : undefined,
      endAt: data.endAt ? new Date(data.endAt) : undefined,
      capacity: data.capacity,
      typeId: data.typeId,
      requiresEnrollment: data.requiresEnrollment,
      requiresConfirmation: data.requiresConfirmation,
      confirmationDays: data.confirmationDays,
    };

    await this.prisma.activity.update({
      where: { id: activityId },
      data: updateData,
    });

    if (data.speakers) {
      // Direct replacement for simplicity
      await this.prisma.activitySpeaker.deleteMany({ where: { activityId } });
      if (data.speakers.length > 0) {
        await this.prisma.activitySpeaker.createMany({
          data: data.speakers.map((s) => ({
            activityId,
            speakerId: s.speakerId,
            roleId: s.roleId,
          })),
        });
      }
    }

    await this.kanbanAutomation.handleActivityUpsert(activityId);

    // Auto-enroll existing participants if enrollment requirement is removed or confirmed false
    const updatedActivity = await this.getActivityForTenant(
      tenantId,
      activityId,
    );
    if (!updatedActivity.requiresEnrollment) {
      const activityFromDb = await this.prisma.activity.findUnique({
        where: { id: activityId },
      });

      if (activityFromDb) {
        const registrations = await this.prisma.registration.findMany({
          where: { eventId: activityFromDb.eventId },
          select: { id: true },
        });

        if (registrations.length > 0) {
          await this.prisma.activityEnrollment.createMany({
            data: registrations.map((r) => ({
              activityId: activityId,
              registrationId: r.id,
            })),
            skipDuplicates: true,
          });
        }
      }
    }

    return updatedActivity;
  }

  async enrollInActivity(params: { userId: string; activityId: string }) {
    const { userId, activityId } = params;

    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        event: true,
        enrollments: true,
      },
    });

    if (!activity) {
      throw new NotFoundException("Atividade não encontrada.");
    }

    const registration = await this.prisma.registration.findFirst({
      where: {
        eventId: activity.eventId,
        userId,
      },
    });

    if (!registration) {
      throw new ForbiddenException(
        "Você precisa estar inscrito no evento para se inscrever nas atividades.",
      );
    }

    // Check for time conflicts with already enrolled activities
    const otherEnrollments = await this.prisma.activityEnrollment.findMany({
      where: {
        registrationId: registration.id,
        activityId: { not: activityId },
      },
      include: {
        activity: true,
      },
    });

    const hasConflict = otherEnrollments.some((enrollment) => {
      const other = enrollment.activity;
      return activity.startAt < other.endAt && activity.endAt > other.startAt;
    });

    if (hasConflict) {
      throw new ForbiddenException(
        "Esta atividade conflita com outra em que você já está matriculado.",
      );
    }

    if (
      activity.capacity != null &&
      activity.enrollments.length >= activity.capacity
    ) {
      throw new ForbiddenException(
        "Capacidade máxima atingida para esta atividade.",
      );
    }

    const alreadyEnrolled = await this.prisma.activityEnrollment.findFirst({
      where: {
        activityId,
        registrationId: registration.id,
      },
    });

    if (alreadyEnrolled) {
      return activity;
    }

    await this.prisma.activityEnrollment.create({
      data: {
        activityId,
        registrationId: registration.id,
        status: activity.requiresConfirmation
          ? EnrollmentStatus.PENDING
          : EnrollmentStatus.CONFIRMED,
        confirmedAt: activity.requiresConfirmation ? null : new Date(),
      },
    });

    return this.prisma.activity.findUnique({
      where: { id: activityId },
      include: { enrollments: true },
    });
  }

  async deleteActivity(tenantId: string, activityId: string) {
    const activity = await this.prisma.activity.findFirst({
      where: {
        id: activityId,
        event: { tenantId },
      },
    });

    if (!activity) {
      throw new NotFoundException("Atividade não encontrada para este tenant.");
    }

    // ActivitySpeakers and ActivityEnrollments and Attendances should be deleted
    await this.prisma.activitySpeaker.deleteMany({ where: { activityId } });
    await this.prisma.activityEnrollment.deleteMany({ where: { activityId } });
    await this.prisma.attendance.deleteMany({ where: { activityId } });

    return this.prisma.activity.delete({
      where: { id: activityId },
    });
  }

  async unrollFromActivity(params: { userId: string; activityId: string }) {
    const { userId, activityId } = params;

    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException("Atividade não encontrada.");
    }

    const registration = await this.prisma.registration.findFirst({
      where: {
        eventId: activity.eventId,
        userId,
      },
    });

    if (!registration) {
      throw new ForbiddenException(
        "Você não está inscrito no evento desta atividade.",
      );
    }

    const enrollment = await this.prisma.activityEnrollment.findFirst({
      where: {
        activityId,
        registrationId: registration.id,
      },
    });

    if (!enrollment) {
      throw new NotFoundException("Inscrição na atividade não encontrada.");
    }

    // We allow unrolling regardless of status, as long as it's not an automated enrollment
    // If the activity doesn't require enrollment, everyone registered for the event is "enrolled"
    // but the actual ActivityEnrollment records are created by createMany in create/update activity.
    // For manual enrollments (requiresEnrollment: true), the user should be allowed to unroll.

    return this.prisma.activityEnrollment.delete({
      where: { id: enrollment.id },
    });
  }

  // Activity Types
  async createType(tenantId: string, name: string) {
    return this.prisma.activityType.create({
      data: { tenantId, name },
    });
  }

  async findAllTypes(tenantId: string) {
    return this.prisma.activityType.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async removeType(tenantId: string, id: string) {
    const type = await this.prisma.activityType.findFirst({
      where: { id, tenantId },
    });
    if (!type) throw new NotFoundException("Type not found");
    return this.prisma.activityType.delete({ where: { id } });
  }

  // Enrollment Management
  async listEnrollments(tenantId: string, activityId: string) {
    const activity = await this.getActivityForTenant(tenantId, activityId);

    return this.prisma.activityEnrollment.findMany({
      where: { activityId: activity.id },
      include: {
        registration: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async confirmEnrollment(
    tenantId: string,
    activityId: string,
    enrollmentId: string,
  ) {
    await this.getActivityForTenant(tenantId, activityId);

    const enrollment = await this.prisma.activityEnrollment.findUnique({
      where: { id: enrollmentId, activityId },
    });

    if (!enrollment) {
      throw new NotFoundException("Inscrição não encontrada.");
    }

    if (enrollment.status === EnrollmentStatus.CONFIRMED) {
      return enrollment;
    }

    return this.prisma.activityEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: EnrollmentStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
    });
  }

  async addMaterial(
    tenantId: string,
    activityId: string,
    data: { title: string; fileUrl: string; fileType?: string },
  ) {
    await this.getActivityForTenant(tenantId, activityId);

    return this.prisma.activityMaterial.create({
      data: {
        activityId,
        title: data.title,
        fileUrl: data.fileUrl,
        fileType: data.fileType || "SLIDES",
      },
    });
  }

  async removeMaterial(
    tenantId: string,
    activityId: string,
    materialId: string,
  ) {
    await this.getActivityForTenant(tenantId, activityId);

    return this.prisma.activityMaterial.delete({
      where: { id: materialId },
    });
  }

  async getPublicActivityInfo(activityId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        event: {
          select: {
            name: true,
            tenant: {
              select: {
                logoUrl: true,
                name: true,
              },
            },
          },
        },
        speakers: {
          include: {
            speaker: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException("Atividade não encontrada");
    }

    return {
      id: activity.id,
      title: activity.title,
      startAt: activity.startAt,
      endAt: activity.endAt,
      eventName: activity.event.name,
      tenantName: activity.event.tenant.name,
      tenantLogo: activity.event.tenant.logoUrl,
      speakers: activity.speakers.map((s) => ({
        name: s.speaker.name,
        avatarUrl: s.speaker.avatarUrl,
      })),
    };
  }

  async submitPublicFeedback(
    activityId: string,
    data: { rating: number; comment?: string; userId?: string },
  ) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException("Atividade não encontrada");
    }

    if (data.rating < 1 || data.rating > 5) {
      throw new Error("Nota deve estar entre 1 e 5");
    }

    const feedback = await this.prisma.activityFeedback.create({
      data: {
        activityId,
        rating: data.rating,
        comment: data.comment,
      },
    });

    if (data.userId) {
      const xpAmount =
        await this.gamificationService.getXpForAction("FEEDBACK_SUBMITTED");
      await this.gamificationService.awardXp(
        data.userId,
        xpAmount,
        "FEEDBACK_SUBMITTED",
        `FEEDBACK_${activityId}_${data.userId}`,
        activity.eventId,
      );
    }

    return feedback;
  }
}
