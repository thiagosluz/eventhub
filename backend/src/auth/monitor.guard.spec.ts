import { Test, TestingModule } from "@nestjs/testing";
import { MonitorGuard } from "./monitor.guard";
import { PrismaService } from "../prisma/prisma.service";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";

describe("MonitorGuard", () => {
  let guard: MonitorGuard;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitorGuard,
        {
          provide: PrismaService,
          useValue: {
            event: {
              findFirst: jest.fn(),
            },
            eventMonitor: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    guard = module.get<MonitorGuard>(MonitorGuard);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  it("should return true if user is ADMIN", async () => {
    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { sub: "user1", role: "ORGANIZER" },
          params: { eventId: "event1" },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(await guard.canActivate(context)).toBe(true);
  });

  it("should return true if user is monitor of the event", async () => {
    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { sub: "user1", role: "USER" },
          params: { eventId: "event1" },
        }),
      }),
    } as unknown as ExecutionContext;

    (prisma.eventMonitor.findUnique as jest.Mock).mockResolvedValue({
      id: "em1",
      event: { tenantId: "tenant1" },
    });

    expect(await guard.canActivate(context)).toBe(true);
    expect(prisma.eventMonitor.findUnique).toHaveBeenCalledWith({
      where: {
        eventId_userId: {
          eventId: "event1",
          userId: "user1",
        },
      },
      include: {
        event: {
          select: { tenantId: true },
        },
      },
    });
  });

  it("should throw ForbiddenException if user is not monitor", async () => {
    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { sub: "user1", role: "USER" },
          params: { eventId: "event1" },
        }),
      }),
    } as unknown as ExecutionContext;

    (prisma.eventMonitor.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("should return false if eventId is missing", async () => {
    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { sub: "user1", role: "USER" },
          params: {},
        }),
      }),
    } as unknown as ExecutionContext;

    expect(await guard.canActivate(context)).toBe(false);
  });
});
