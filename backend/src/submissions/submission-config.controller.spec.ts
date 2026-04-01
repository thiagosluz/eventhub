import { Test, TestingModule } from "@nestjs/testing";
import { SubmissionConfigController } from "./submission-config.controller";
import { SubmissionConfigService } from "./submission-config.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";

describe("SubmissionConfigController", () => {
  let controller: SubmissionConfigController;
  let service: SubmissionConfigService;

  const mockConfigService = {
    getConfig: jest.fn(),
    updateConfig: jest.fn(),
    createModality: jest.fn(),
    deleteModality: jest.fn(),
    createThematicArea: jest.fn(),
    deleteThematicArea: jest.fn(),
    createRule: jest.fn(),
    deleteRule: jest.fn(),
  };

  const mockRequest = {
    user: {
      tenantId: "tenant_id",
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubmissionConfigController],
      providers: [
        {
          provide: SubmissionConfigService,
          useValue: mockConfigService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SubmissionConfigController>(SubmissionConfigController);
    service = module.get<SubmissionConfigService>(SubmissionConfigService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should get config", async () => {
    await controller.getConfig("e1", mockRequest);
    expect(service.getConfig).toHaveBeenCalledWith("tenant_id", "e1");
  });

  it("should update config", async () => {
    const body = { name: "C1" };
    await controller.updateConfig("e1", body as any, mockRequest);
    expect(service.updateConfig).toHaveBeenCalledWith("tenant_id", "e1", body);
  });

  it("should create modality", async () => {
    const body = { name: "M1" };
    const file = { buffer: Buffer.from("f"), mimetype: "m" };
    await controller.createModality("e1", body as any, file, mockRequest);
    expect(service.createModality).toHaveBeenCalledWith("tenant_id", "e1", body, {
      buffer: file.buffer,
      mimetype: file.mimetype,
    });
  });

  it("should delete modality", async () => {
    await controller.deleteModality("e1", "m1", mockRequest);
    expect(service.deleteModality).toHaveBeenCalledWith("tenant_id", "e1", "m1");
  });

  it("should create thematic area", async () => {
    const body = { name: "T1" };
    await controller.createThematicArea("e1", body as any, mockRequest);
    expect(service.createThematicArea).toHaveBeenCalledWith("tenant_id", "e1", body);
  });

  it("should delete thematic area", async () => {
    await controller.deleteThematicArea("e1", "a1", mockRequest);
    expect(service.deleteThematicArea).toHaveBeenCalledWith("tenant_id", "e1", "a1");
  });

  it("should create rule", async () => {
    const body = { name: "R1" } as any;
    const file = { buffer: Buffer.from("f"), mimetype: "m" };
    await controller.createRule("e1", body, file, mockRequest);
    expect(service.createRule).toHaveBeenCalledWith("tenant_id", "e1", body, {
      buffer: file.buffer,
      mimetype: file.mimetype,
    });
  });

  it("should throw if no file in createRule", async () => {
    await expect(controller.createRule("e1", {} as any, null, mockRequest)).rejects.toThrow(
      "Arquivo PDF é obrigatório.",
    );
  });

  it("should delete rule", async () => {
    await controller.deleteRule("e1", "r1", mockRequest);
    expect(service.deleteRule).toHaveBeenCalledWith("tenant_id", "e1", "r1");
  });
});
