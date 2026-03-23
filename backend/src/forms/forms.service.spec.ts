import { Test, TestingModule } from "@nestjs/testing";
import { FormsService } from "./forms.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("FormsService", () => {
  let service: FormsService;

  const mockPrismaService = {
    event: {
      findFirst: jest.fn(),
    },
    customForm: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    customFormField: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<FormsService>(FormsService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getRegistrationForm", () => {
    it("should return form with fields", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.customForm.findFirst.mockResolvedValue({
        id: "f1",
        fields: [],
      });

      const result = await service.getRegistrationForm("t1", "e1");
      expect(result?.id).toBe("f1");
    });
  });

  describe("saveRegistrationForm", () => {
    it("should create form if not exists and upsert fields", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.customForm.findFirst.mockResolvedValue(null); // No existing form
      mockPrismaService.customForm.create.mockResolvedValue({
        id: "f1",
        name: "Form",
      });
      mockPrismaService.customFormField.findMany.mockResolvedValue([]);

      await service.saveRegistrationForm("t1", "e1", {
        name: "Form",
        fields: [{ label: "Age", type: "NUMBER", required: true, order: 1 }],
      });

      expect(mockPrismaService.customForm.create).toHaveBeenCalled();
      expect(mockPrismaService.customFormField.create).toHaveBeenCalled();
    });

    it("should delete removed fields and update existing ones", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.customForm.findFirst.mockResolvedValue({
        id: "f1",
        name: "Old Name",
      });
      mockPrismaService.customForm.update.mockResolvedValue({ id: "f1" });
      mockPrismaService.customFormField.findMany.mockResolvedValue([
        { id: "field-to-delete", label: "Old" },
        { id: "field-to-keep", label: "Keep" },
      ]);

      await service.saveRegistrationForm("t1", "e1", {
        name: "New Name",
        fields: [
          { id: "field-to-keep", label: "Updated", type: "TEXT", required: true, order: 1 },
          { label: "New Field", type: "TEXT", required: false, order: 2 },
        ],
      });

      expect(mockPrismaService.customFormField.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ["field-to-delete"] } },
      });
      expect(mockPrismaService.customFormField.update).toHaveBeenCalledWith({
        where: { id: "field-to-keep" },
        data: expect.objectContaining({ label: "Updated" }),
      });
      expect(mockPrismaService.customFormField.create).toHaveBeenCalled();
    });

    it("should throw NotFound if event not found", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue(null);
      await expect(
        service.saveRegistrationForm("t1", "e1", { name: "X", fields: [] }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
