import { Test, TestingModule } from "@nestjs/testing";
import { SponsorsController } from "./sponsors.controller";
import { SponsorsService } from "./sponsors.service";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "../auth/roles.types";

describe("SponsorsController", () => {
  let controller: SponsorsController;

  const mockSponsorsService = {
    createCategory: jest.fn(),
    listCategoriesByEvent: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
    createSponsor: jest.fn(),
    updateSponsor: jest.fn(),
    deleteSponsor: jest.fn(),
    uploadLogo: jest.fn(),
    listPublicSponsorsByEventSlug: jest.fn(),
  };

  const mockJwtService = {
    decode: jest.fn(),
  };

  const mockRequest = {
    user: { tenantId: "tenant-1", role: UserRole.ORGANIZER },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SponsorsController],
      providers: [
        { provide: SponsorsService, useValue: mockSponsorsService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<SponsorsController>(SponsorsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("Categories", () => {
    it("should create a category", async () => {
      const dto = { name: "Gold", order: 1 };
      await controller.createCategory("event-1", dto, mockRequest as any);
      expect(mockSponsorsService.createCategory).toHaveBeenCalledWith(
        "tenant-1",
        "event-1",
        dto,
      );
    });

    it("should list categories", async () => {
      await controller.listCategories("event-1", mockRequest as any);
      expect(mockSponsorsService.listCategoriesByEvent).toHaveBeenCalledWith(
        "tenant-1",
        "event-1",
      );
    });

    it("should update a category", async () => {
      const dto = { name: "Silver" };
      await controller.updateCategory("cat-1", dto, mockRequest as any);
      expect(mockSponsorsService.updateCategory).toHaveBeenCalledWith(
        "tenant-1",
        "cat-1",
        dto,
      );
    });

    it("should delete a category", async () => {
      await controller.deleteCategory("cat-1", mockRequest as any);
      expect(mockSponsorsService.deleteCategory).toHaveBeenCalledWith(
        "tenant-1",
        "cat-1",
      );
    });
  });

  describe("Sponsors", () => {
    it("should create a sponsor", async () => {
      const dto = { name: "Google", categoryId: "cat-1" };
      await controller.createSponsor(dto as any, mockRequest as any);
      expect(mockSponsorsService.createSponsor).toHaveBeenCalledWith(
        "tenant-1",
        dto,
      );
    });

    it("should update a sponsor", async () => {
      const dto = { name: "Google Updated" };
      await controller.updateSponsor("sp-1", dto as any, mockRequest as any);
      expect(mockSponsorsService.updateSponsor).toHaveBeenCalledWith(
        "tenant-1",
        "sp-1",
        dto,
      );
    });

    it("should delete a sponsor", async () => {
      await controller.deleteSponsor("sp-1", mockRequest as any);
      expect(mockSponsorsService.deleteSponsor).toHaveBeenCalledWith(
        "tenant-1",
        "sp-1",
      );
    });

    it("should upload logo", async () => {
      const file = { buffer: Buffer.from(""), mimetype: "image/png" };
      await controller.uploadLogo("sp-1", file as any, mockRequest as any);
      expect(mockSponsorsService.uploadLogo).toHaveBeenCalledWith(
        "tenant-1",
        "sp-1",
        file,
      );
    });
  });

  describe("Public", () => {
    it("should list public sponsors with tenant extraction from JWT", async () => {
      mockJwtService.decode.mockReturnValue({ tenantId: "tenant-jwt" });
      const req = { headers: { authorization: "Bearer token" } };

      await controller.listPublicSponsors("event-slug", req as any);

      expect(
        mockSponsorsService.listPublicSponsorsByEventSlug,
      ).toHaveBeenCalledWith("event-slug", "tenant-jwt");
    });

    it("should list public sponsors without tenant if JWT missing", async () => {
      const req = { headers: {} };
      await controller.listPublicSponsors("event-slug", req as any);
      expect(
        mockSponsorsService.listPublicSponsorsByEventSlug,
      ).toHaveBeenCalledWith("event-slug", undefined);
    });
  });
});
