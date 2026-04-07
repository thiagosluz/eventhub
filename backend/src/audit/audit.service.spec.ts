import { Test, TestingModule } from "@nestjs/testing";
import { AuditService } from "./audit.service";
import { PrismaService } from "../prisma/prisma.service";

describe("AuditService", () => {
  let service: AuditService;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create an audit log", async () => {
      const logData = {
        userId: "user-1",
        action: "CREATE_EVENT",
        resource: "Event",
        resourceId: "event-1",
        eventId: "event-1",
        payload: { name: "Test Event" },
        ip: "127.0.0.1",
        userAgent: "Jest",
      };

      mockPrismaService.auditLog.create.mockResolvedValue({
        id: "log-1",
        ...logData,
      });

      const result = await service.create(logData);

      expect(result.id).toBe("log-1");
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          action: "CREATE_EVENT",
        }),
      });
    });
  });

  describe("findByEvent", () => {
    it("should return audit logs for an event", async () => {
      const eventId = "event-1";
      const mockLogs = [
        {
          id: "log-1",
          eventId,
          action: "UPDATE_EVENT",
          user: { name: "User 1" },
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.findByEvent(eventId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("log-1");
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { eventId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    });
  });
});
