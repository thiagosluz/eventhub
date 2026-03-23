import { Test, TestingModule } from "@nestjs/testing";
import { SpeakersService } from "./speakers.service";
import { PrismaService } from "../prisma/prisma.service";
import { MinioService } from "../storage/minio.service";
import { UserRole } from "../auth/roles.types";

describe("SpeakersService", () => {
  let service: SpeakersService;

  const mockPrismaService = {
    speaker: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    speakerRole: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    activitySpeaker: {
      findMany: jest.fn(),
    },
    activityFeedback: {
      findMany: jest.fn(),
    },
    activityMaterial: {
      create: jest.fn(),
    },
  };

  const mockMinioService = {
    uploadObject: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpeakersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MinioService, useValue: mockMinioService },
      ],
    }).compile();

    service = module.get<SpeakersService>(SpeakersService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a speaker and upgrade user role if userId is provided", async () => {
      const dto = { name: "John Doe", email: "john@test.com", userId: "u1" };
      mockPrismaService.speaker.create.mockResolvedValue({ id: "s1", ...dto });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "u1",
        role: UserRole.PARTICIPANT,
      });

      const result = await service.create("t1", dto);

      expect(result.id).toBe("s1");
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { role: UserRole.SPEAKER },
      });
    });
  });

  describe("update", () => {
    it("should downgrade user role when unlinking (userId: null)", async () => {
      const existingSpeaker = { id: "s1", userId: "u1", tenantId: "t1" };
      mockPrismaService.speaker.findFirst.mockResolvedValue(existingSpeaker);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "u1",
        role: UserRole.SPEAKER,
      });
      mockPrismaService.speaker.update.mockResolvedValue({
        id: "s1",
        userId: null,
      });

      await service.update("t1", "s1", { userId: null });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { role: UserRole.PARTICIPANT },
      });
    });

    it("should sync profile data to linked user", async () => {
      const existingSpeaker = { id: "s1", userId: "u1", tenantId: "t1" };
      mockPrismaService.speaker.findFirst.mockResolvedValue(existingSpeaker);
      mockPrismaService.speaker.update.mockResolvedValue({
        id: "s1",
        userId: "u1",
      });

      await service.update("t1", "s1", { name: "New Name", bio: "New Bio" });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { name: "New Name", bio: "New Bio" },
      });
    });
  });

  describe("Speaker Portal", () => {
    it("should find activities for a speaker", async () => {
      mockPrismaService.activitySpeaker.findMany.mockResolvedValue([
        { id: "as1" },
      ]);
      const result = await service.findActivities("s1");
      expect(result).toHaveLength(1);
    });

    it("should add material to an activity", async () => {
      mockPrismaService.activityMaterial.create.mockResolvedValue({ id: "m1" });
      const result = await service.addMaterial("a1", {
        title: "Slides",
        fileUrl: "http://slides.com",
      });
      expect(result.id).toBe("m1");
    });
  });
});
