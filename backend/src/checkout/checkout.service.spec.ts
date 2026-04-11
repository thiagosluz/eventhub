import { Test, TestingModule } from "@nestjs/testing";
import { CheckoutService } from "./checkout.service";
import { PrismaService } from "../prisma/prisma.service";
import { ActivitiesService } from "../activities/activities.service";
import { FreeTicketStrategy } from "./free-ticket.strategy";
import { MailService } from "../mail/mail.service";
import { BadgesService } from "../badges/badges.service";
import { NotFoundException, ConflictException } from "@nestjs/common";

describe("CheckoutService", () => {
  let service: CheckoutService;

  const mockPrismaService = {
    event: {
      findUnique: jest.fn(),
    },
    registration: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    activity: {
      findMany: jest.fn(),
    },
    activityEnrollment: {
      createMany: jest.fn(),
    },
    customFormResponse: {
      create: jest.fn(),
    },
    customFormAnswer: {
      create: jest.fn(),
    },
    customForm: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockActivitiesService = {
    enrollInActivity: jest.fn(),
  };

  const mockFreeTicketStrategy = {
    process: jest.fn(),
  };

  const mockMailService = {
    enqueue: jest.fn(),
  };

  const mockBadgesService = {
    checkAndAwardBadge: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ActivitiesService, useValue: mockActivitiesService },
        { provide: FreeTicketStrategy, useValue: mockFreeTicketStrategy },
        { provide: MailService, useValue: mockMailService },
        { provide: BadgesService, useValue: mockBadgesService },
      ],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("processCheckout", () => {
    const checkoutInput = {
      eventId: "event_1",
      userId: "user_1",
      activityIds: ["activity_1"],
    };

    it("should throw NotFoundException if event not found", async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.processCheckout(checkoutInput)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw ConflictException if user already registered", async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ id: "event_1" });
      mockPrismaService.registration.findFirst.mockResolvedValue({
        id: "reg_1",
      });

      await expect(service.processCheckout(checkoutInput)).rejects.toThrow(
        ConflictException,
      );
    });

    it("should process checkout successfully", async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        id: "event_1",
        name: "Test Event",
      });
      mockPrismaService.registration.findFirst.mockResolvedValue(null);
      mockPrismaService.registration.create.mockResolvedValue({
        id: "reg_new",
      });
      mockPrismaService.activity.findMany.mockResolvedValue([]);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user_1",
        email: "test@example.com",
      });
      mockFreeTicketStrategy.process.mockResolvedValue({
        tickets: [],
        totalAmount: "0.00",
      });

      const result = await service.processCheckout(checkoutInput);

      expect(result.registrationId).toBe("reg_new");
      expect(mockFreeTicketStrategy.process).toHaveBeenCalled();
      expect(mockMailService.enqueue).toHaveBeenCalled();
    });

    it("should auto-enroll in activities with requiresEnrollment false", async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ id: "e1" });
      mockPrismaService.registration.create.mockResolvedValue({ id: "reg1" });
      mockPrismaService.activity.findMany.mockResolvedValue([{ id: "act1" }]); // requiresEnrollment: false
      mockPrismaService.user.findUnique.mockResolvedValue({ id: "u1" });
      mockFreeTicketStrategy.process.mockResolvedValue({});

      await service.processCheckout({
        eventId: "e1",
        userId: "u1",
        activityIds: [],
      });

      expect(
        mockPrismaService.activityEnrollment.createMany,
      ).toHaveBeenCalled();
    });

    it("should process custom form responses if provided", async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ id: "e1" });
      mockPrismaService.registration.create.mockResolvedValue({ id: "reg1" });
      mockPrismaService.activity.findMany.mockResolvedValue([]);
      mockPrismaService.user.findUnique.mockResolvedValue({ id: "u1" });
      mockPrismaService.customFormResponse.create.mockResolvedValue({
        id: "resp1",
      });
      mockPrismaService.customForm.findUnique.mockResolvedValue({
        id: "f1",
        fields: [{ id: "fld1", type: "TEXT", required: true }],
      });
      mockPrismaService.customFormAnswer.create.mockResolvedValue({});

      await service.processCheckout({
        eventId: "e1",
        userId: "u1",
        activityIds: [],
        formResponses: [
          { formId: "f1", answers: [{ fieldId: "fld1", value: "answer1" }] },
        ],
      });

      expect(mockPrismaService.customFormResponse.create).toHaveBeenCalled();
      expect(mockPrismaService.customFormAnswer.create).toHaveBeenCalled();
    });
  });
});
