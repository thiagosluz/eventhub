import { Test, TestingModule } from "@nestjs/testing";
import { AnalyticsService } from "./analytics.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("AnalyticsService", () => {
  let service: AnalyticsService;

  const mockPrismaService = {
    event: {
      findFirst: jest.fn(),
    },
    registration: {
      findMany: jest.fn(),
    },
    attendance: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getEventAnalytics", () => {
    it("should calculate correct metrics for an event", async () => {
      const mockEvent = {
        id: "e1",
        name: "Conference 2026",
        activities: [
          {
            id: "a1",
            title: "Keynote",
            type: { name: "Main" },
            capacity: 100,
            enrollments: [{}, {}, {}], // 3 enrolled
            attendances: [{}, {}], // 2 attended
          },
        ],
        registrations: [
          {
            id: "r1",
            createdAt: new Date(),
            tickets: [{ status: "COMPLETED", type: "VIP", attendances: [] }],
          },
        ],
      };

      mockPrismaService.event.findFirst.mockResolvedValue(mockEvent);

      const result = await service.getEventAnalytics("t1", "e1");

      expect(result.eventId).toBe("e1");
      expect(result.totalRegistrations).toBe(1);

      // Activity participation check
      expect(result.activityParticipation[0].enrolled).toBe(3);
      expect(result.activityParticipation[0].attended).toBe(2);
      expect(result.activityParticipation[0].occupancyRate).toBe(3); // 3/100 * 100

      // Registration status check
      expect(result.registrationStatus).toContainEqual({
        name: "COMPLETED",
        value: 1,
      });

      // Ticket distribution check
      expect(result.ticketDistribution).toContainEqual({
        name: "VIP",
        value: 1,
      });
    });

    it("should throw NotFoundException if event is not found", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue(null);

      await expect(service.getEventAnalytics("t1", "e999")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getEventParticipants", () => {
    it("should map registrations to participant list", async () => {
      mockPrismaService.registration.findMany.mockResolvedValue([
        {
          id: "r1",
          userId: "u1",
          createdAt: new Date(),
          user: { name: "Thiago", email: "thiago@test.com" },
          tickets: [
            {
              type: "REGULAR",
              status: "COMPLETED",
              qrCodeToken: "T123",
              attendances: [],
            },
          ],
          enrollments: [{}],
        },
      ]);

      const result = await service.getEventParticipants("t1", "e1");

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Thiago");
      expect(result[0].enrollmentsCount).toBe(1);
    });
  });

  describe("getEventCheckins", () => {
    it("should return checkin list", async () => {
      mockPrismaService.attendance.findMany.mockResolvedValue([
        {
          id: "att1",
          checkedAt: new Date(),
          activity: { title: "Workshop" },
          ticket: {
            type: "VIP",
            registration: {
              user: { name: "Alice", email: "alice@test.com" },
            },
          },
        },
      ]);

      const result = await service.getEventCheckins("t1", "e1", "a1");

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Alice");
      expect(result[0].activityName).toBe("Workshop");
    });
  });
});
