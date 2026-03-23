import { Test, TestingModule } from "@nestjs/testing";
import { FormsService } from "./forms.service";
import { PrismaService } from "../prisma/prisma.service";

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
  });
});
