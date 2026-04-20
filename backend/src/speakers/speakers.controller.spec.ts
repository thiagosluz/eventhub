import { Test, TestingModule } from "@nestjs/testing";
import { SpeakersController } from "./speakers.controller";
import { SpeakersService } from "./speakers.service";
import { UserRole } from "../auth/roles.types";

describe("SpeakersController", () => {
  let controller: SpeakersController;

  const mockSpeakersService = {
    findByUserId: jest.fn(),
    findActivities: jest.fn(),
    getFeedbacks: jest.fn(),
    addMaterial: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    uploadAvatar: jest.fn(),
    createRole: jest.fn(),
    findAllRoles: jest.fn(),
    removeRole: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockRequest = {
    user: { sub: "user-1", tenantId: "tenant-1", role: UserRole.SPEAKER },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpeakersController],
      providers: [{ provide: SpeakersService, useValue: mockSpeakersService }],
    }).compile();

    controller = module.get<SpeakersController>(SpeakersController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("Portal do Palestrante", () => {
    it("should get me", async () => {
      mockSpeakersService.findByUserId.mockResolvedValue({ id: "sp-1" });
      const result = await controller.getMe(mockRequest as any);
      expect(result.id).toBe("sp-1");
    });

    it("should get my activities", async () => {
      mockSpeakersService.findByUserId.mockResolvedValue({ id: "sp-1" });
      mockSpeakersService.findActivities.mockResolvedValue([]);
      const result = await controller.getMyActivities(mockRequest as any);
      expect(result).toEqual([]);
    });

    it("should add material to activity", async () => {
      mockSpeakersService.findByUserId.mockResolvedValue({ id: "sp-1" });
      mockSpeakersService.findActivities.mockResolvedValue([
        { activityId: "act-1" },
      ]);
      mockSpeakersService.addMaterial.mockResolvedValue({ id: "mat-1" });

      const result = await controller.addMaterial(mockRequest as any, "act-1", {
        title: "Slides",
        fileUrl: "url",
      });
      expect(result.id).toBe("mat-1");
    });

    it("should throw error if adding material to unauthorized activity", async () => {
      mockSpeakersService.findByUserId.mockResolvedValue({ id: "sp-1" });
      mockSpeakersService.findActivities.mockResolvedValue([
        { activityId: "other" },
      ]);

      await expect(
        controller.addMaterial(mockRequest as any, "act-1", {
          title: "X",
          fileUrl: "Y",
        }),
      ).rejects.toThrow(
        "Você não tem permissão para adicionar materiais a esta atividade.",
      );
    });
  });

  describe("Admin / Organizer", () => {
    const orgReq = { user: { tenantId: "tenant-1", role: UserRole.ORGANIZER } };

    it("should create speaker", async () => {
      await controller.create(orgReq as any, { name: "New" } as any);
      expect(mockSpeakersService.create).toHaveBeenCalled();
    });

    it("should manage roles", async () => {
      await controller.createRole(orgReq as any, "Keynote");
      expect(mockSpeakersService.createRole).toHaveBeenCalledWith(
        "tenant-1",
        "Keynote",
      );
      expect(mockSpeakersService.createRole).toHaveBeenCalledWith(
        "tenant-1",
        "Keynote",
      );
    });

    it("should find all roles", async () => {
      mockSpeakersService.findAllRoles.mockResolvedValue([]);
      await controller.findAllRoles(orgReq as any);
      expect(mockSpeakersService.findAllRoles).toHaveBeenCalled();
    });

    it("should remove a role", async () => {
      await controller.removeRole(orgReq as any, "r1");
      expect(mockSpeakersService.removeRole).toHaveBeenCalledWith(
        "tenant-1",
        "r1",
      );
    });

    it("should find all speakers", async () => {
      mockSpeakersService.findAll.mockResolvedValue([]);
      await controller.findAll(orgReq as any);
      expect(mockSpeakersService.findAll).toHaveBeenCalledWith("tenant-1");
    });

    it("should find one speaker", async () => {
      mockSpeakersService.findOne.mockResolvedValue({ id: "s1" });
      await controller.findOne(orgReq as any, "s1");
      expect(mockSpeakersService.findOne).toHaveBeenCalledWith(
        "tenant-1",
        "s1",
      );
    });

    it("should remove a speaker", async () => {
      await controller.remove(orgReq as any, "s1");
      expect(mockSpeakersService.remove).toHaveBeenCalledWith("tenant-1", "s1");
    });
  });

  describe("Portal do Palestrante - Feedbacks", () => {
    it("should get my feedbacks", async () => {
      mockSpeakersService.findByUserId.mockResolvedValue({ id: "sp-1" });
      mockSpeakersService.getFeedbacks.mockResolvedValue({
        data: [],
        total: 0,
        averageRating: 0,
      });
      const result = await controller.getMyFeedbacks(mockRequest as any);
      expect(result).toEqual({ data: [], total: 0, averageRating: 0 });
      expect(mockSpeakersService.getFeedbacks).toHaveBeenCalledWith("sp-1", {
        activityId: undefined,
        rating: undefined,
        page: 1,
        limit: 10,
      });
    });
  });

  describe("Uploads", () => {
    it("should upload avatar", async () => {
      const file = { buffer: Buffer.from(""), mimetype: "image/png" };
      mockSpeakersService.uploadAvatar.mockResolvedValue({ url: "ok" });
      await controller.uploadFile(mockRequest as any, file);
      expect(mockSpeakersService.uploadAvatar).toHaveBeenCalledWith(
        "tenant-1",
        file,
      );
    });
  });

  describe("Updates", () => {
    it("should allow speaker to update own profile", async () => {
      mockSpeakersService.findByUserId.mockResolvedValue({
        id: "sp-1",
        tenantId: "tenant-1",
      });
      await controller.update(mockRequest as any, "sp-1", { bio: "New bio" });
      expect(mockSpeakersService.update).toHaveBeenCalledWith(
        "tenant-1",
        "sp-1",
        { bio: "New bio" },
      );
    });

    it("should throw error if speaker tries to update another profile", async () => {
      mockSpeakersService.findByUserId.mockResolvedValue({ id: "sp-1" });
      await expect(
        controller.update(mockRequest as any, "sp-2", { bio: "Hack" }),
      ).rejects.toThrow("Você só pode atualizar seu próprio perfil.");
    });
  });
});
