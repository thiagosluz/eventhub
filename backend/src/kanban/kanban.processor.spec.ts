import { Test, TestingModule } from "@nestjs/testing";
import { KanbanAlertsProcessor } from "./kanban.processor";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { Job } from "bullmq";

describe("KanbanAlertsProcessor", () => {
  let processor: KanbanAlertsProcessor;
  let prisma: PrismaService;
  let mailService: MailService;

  const mockPrismaService = {
    kanbanTask: {
      findMany: jest.fn(),
    },
  };

  const mockMailService = {
    enqueue: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KanbanAlertsProcessor,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    processor = module.get<KanbanAlertsProcessor>(KanbanAlertsProcessor);
    prisma = module.get<PrismaService>(PrismaService);
    mailService = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("process", () => {
    it("should call checkDeadlines if job name is check-deadlines", async () => {
      const job = { name: "check-deadlines" } as Job;
      const spy = jest
        .spyOn(processor as any, "checkDeadlines")
        .mockResolvedValue(undefined);

      await processor.process(job);

      expect(spy).toHaveBeenCalled();
    });

    it("should do nothing for unknown job names", async () => {
      const job = { name: "unknown" } as Job;
      const spy = jest.spyOn(processor as any, "checkDeadlines");

      await processor.process(job);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("checkDeadlines", () => {
    it("should query tasks and enqueue emails for assignments", async () => {
      const mockTasks = [
        {
          id: "t1",
          title: "Task 1",
          assignments: [{ user: { email: "user@test.com" } }],
          column: {
            name: "To Do",
            board: { event: { name: "Event 1" } },
          },
        },
      ];
      mockPrismaService.kanbanTask.findMany.mockResolvedValue(mockTasks);

      await (processor as any).checkDeadlines();

      expect(prisma.kanbanTask.findMany).toHaveBeenCalled();
      expect(mailService.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@test.com",
          subject: expect.stringContaining("Task 1"),
        }),
      );
    });

    it("should handle no tasks found", async () => {
      mockPrismaService.kanbanTask.findMany.mockResolvedValue([]);
      await (processor as any).checkDeadlines();
      expect(mailService.enqueue).not.toHaveBeenCalled();
    });
  });
});
