import { Test, TestingModule } from "@nestjs/testing";
import { FreeTicketStrategy } from "./free-ticket.strategy";
import { PrismaService } from "../prisma/prisma.service";

describe("FreeTicketStrategy", () => {
  let strategy: FreeTicketStrategy;

  const mockPrismaService = {
    ticket: {
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FreeTicketStrategy,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    strategy = module.get<FreeTicketStrategy>(FreeTicketStrategy);
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  describe("process", () => {
    const context = {
      userId: "user_1",
      eventId: "event_1",
      registrationId: "reg_1",
      activityIds: ["act_1"],
    };

    it("should create tickets for event and activities", async () => {
      mockPrismaService.ticket.create.mockImplementation((args) => ({
        id: "ticket_" + Math.random(),
        ...args.data,
      }));

      const result = await strategy.process(context);

      expect(result.tickets).toHaveLength(2); // 1 for event, 1 for activity
      expect(result.totalAmount).toBe("0.00");
      expect(mockPrismaService.ticket.create).toHaveBeenCalledTimes(2);
    });

    it("should create only event ticket if no activityIds provided", async () => {
      mockPrismaService.ticket.create.mockImplementation((args) => ({
        id: "ticket_" + Math.random(),
        ...args.data,
      }));

      const result = await strategy.process({ ...context, activityIds: [] });

      expect(result.tickets).toHaveLength(1);
      expect(mockPrismaService.ticket.create).toHaveBeenCalledTimes(1);
    });
  });
});
