import { Test, TestingModule } from "@nestjs/testing";
import { CheckoutService } from "./checkout.service";
import { PrismaService } from "../prisma/prisma.service";
import { ActivitiesService } from "../activities/activities.service";
import { FreeTicketStrategy } from "./free-ticket.strategy";
import { MailService } from "../mail/mail.service";
import { BadgesService } from "../badges/badges.service";
import { GamificationService } from "../gamification/gamification.service";
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

  const mockGamificationService = {
    getXpForAction: jest.fn().mockResolvedValue(100),
    awardXp: jest.fn().mockResolvedValue({ xpGained: 100, isLevelUp: false }),
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
        { provide: GamificationService, useValue: mockGamificationService },
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

    it("should process checkout and skip email if user has no email", async () => {
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
        email: null,
      });
      mockFreeTicketStrategy.process.mockResolvedValue({
        tickets: [],
        totalAmount: "0.00",
      });

      const result = await service.processCheckout(checkoutInput);

      expect(result.registrationId).toBe("reg_new");
      expect(mockFreeTicketStrategy.process).toHaveBeenCalled();
      expect(mockMailService.enqueue).not.toHaveBeenCalled();
    });

    it("should process checkout successfully and enqueue email", async () => {
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

    it("should throw NotFound if custom form does not exist", async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ id: "e1" });
      mockPrismaService.customForm.findUnique.mockResolvedValue(null);

      await expect(
        service.processCheckout({
          eventId: "e1",
          userId: "u1",
          activityIds: [],
          formResponses: [{ formId: "f_invalid", answers: [] }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequest if required field is empty", async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ id: "e1" });
      mockPrismaService.customForm.findUnique.mockResolvedValue({
        id: "f1",
        fields: [{ id: "fld1", type: "TEXT", required: true, label: "Name" }],
      });

      await expect(
        service.processCheckout({
          eventId: "e1",
          userId: "u1",
          activityIds: [],
          formResponses: [
            { formId: "f1", answers: [{ fieldId: "fld1", value: "" }] },
          ],
        }),
      ).rejects.toThrow('O campo "Name" é obrigatório.');
    });

    it("should throw BadRequest if email field is invalid", async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ id: "e1" });
      mockPrismaService.customForm.findUnique.mockResolvedValue({
        id: "f1",
        fields: [
          { id: "fld1", type: "EMAIL", required: false, label: "Email" },
        ],
      });

      await expect(
        service.processCheckout({
          eventId: "e1",
          userId: "u1",
          activityIds: [],
          formResponses: [
            {
              formId: "f1",
              answers: [{ fieldId: "fld1", value: "invalid-email" }],
            },
          ],
        }),
      ).rejects.toThrow('O campo "Email" deve ser um e-mail válido.');
    });

    it("should throw BadRequest if number field is invalid", async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ id: "e1" });
      mockPrismaService.customForm.findUnique.mockResolvedValue({
        id: "f1",
        fields: [{ id: "fld1", type: "NUMBER", required: false, label: "Age" }],
      });

      await expect(
        service.processCheckout({
          eventId: "e1",
          userId: "u1",
          activityIds: [],
          formResponses: [
            {
              formId: "f1",
              answers: [{ fieldId: "fld1", value: "not-a-number" }],
            },
          ],
        }),
      ).rejects.toThrow('O campo "Age" deve ser um número válido.');
    });

    it("should throw BadRequest if date field is invalid", async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ id: "e1" });
      mockPrismaService.customForm.findUnique.mockResolvedValue({
        id: "f1",
        fields: [{ id: "fld1", type: "DATE", required: false, label: "Birth" }],
      });

      await expect(
        service.processCheckout({
          eventId: "e1",
          userId: "u1",
          activityIds: [],
          formResponses: [
            {
              formId: "f1",
              answers: [{ fieldId: "fld1", value: "invalid-date" }],
            },
          ],
        }),
      ).rejects.toThrow('O campo "Birth" deve ser uma data válida.');
    });

    it("should process valid complex form responses activating all switch cases", async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ id: "e1" });
      mockPrismaService.registration.create.mockResolvedValue({ id: "reg1" });
      mockPrismaService.activity.findMany.mockResolvedValue([]);
      mockPrismaService.user.findUnique.mockResolvedValue({ id: "u1" });
      mockPrismaService.customFormResponse.create.mockResolvedValue({
        id: "resp1",
      });
      mockPrismaService.customForm.findUnique.mockResolvedValue({
        id: "f1",
        fields: [
          { id: "f_text", type: "TEXT", required: true },
          { id: "f_email", type: "EMAIL", required: true },
          { id: "f_number", type: "NUMBER", required: true },
          { id: "f_date", type: "DATE", required: true },
        ],
      });
      mockPrismaService.customFormAnswer.create.mockResolvedValue({});

      await service.processCheckout({
        eventId: "e1",
        userId: "u1",
        activityIds: [],
        formResponses: [
          {
            formId: "f1",
            answers: [
              { fieldId: "f_text", value: "ok" },
              { fieldId: "f_email", value: "a@a.com" },
              { fieldId: "f_number", value: "10" },
              { fieldId: "f_date", value: "2024-01-01" },
              { fieldId: "f_empty", value: "" },
            ],
          },
        ],
      });

      expect(mockPrismaService.customFormResponse.create).toHaveBeenCalled();
      expect(mockPrismaService.customFormAnswer.create).toHaveBeenCalledTimes(
        5,
      );
    });
  });
});
