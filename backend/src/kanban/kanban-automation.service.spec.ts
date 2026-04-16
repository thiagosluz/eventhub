import { Test, TestingModule } from "@nestjs/testing";
import { KanbanAutomationService } from "./kanban-automation.service";
import { KanbanService } from "./kanban.service";
import { PrismaService } from "../prisma/prisma.service";

describe("KanbanAutomationService", () => {
  let service: KanbanAutomationService;

  const mockKanbanService = {
    getBoards: jest.fn(),
    getBoardDetails: jest.fn(),
    createTask: jest.fn(),
    moveTask: jest.fn(),
  };

  const mockPrisma = {
    activity: { findUnique: jest.fn() },
    kanbanTask: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KanbanAutomationService,
        { provide: KanbanService, useValue: mockKanbanService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<KanbanAutomationService>(KanbanAutomationService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("handleActivityUpsert", () => {
    it("should return silently if activity not found", async () => {
      mockPrisma.activity.findUnique.mockResolvedValue(null);
      await service.handleActivityUpsert("nonexistent");
      expect(mockKanbanService.getBoards).not.toHaveBeenCalled();
    });

    it("should return silently if board details not found", async () => {
      mockPrisma.activity.findUnique.mockResolvedValue({ id: "a1" });
      mockKanbanService.getBoards.mockResolvedValue([{ id: "b1" }]);
      mockKanbanService.getBoardDetails.mockResolvedValue(null);
      await service.handleActivityUpsert("a1");
      expect(mockPrisma.kanbanTask.findFirst).not.toHaveBeenCalled();
    });

    it("should create task when activity has no speakers", async () => {
      const activity = {
        id: "a1",
        eventId: "e1",
        title: "Palestra AI",
        speakers: [],
        startAt: new Date(),
      };
      mockPrisma.activity.findUnique.mockResolvedValue(activity);
      mockKanbanService.getBoards.mockResolvedValue([{ id: "b1" }]);
      mockKanbanService.getBoardDetails.mockResolvedValue({
        id: "b1",
        columns: [
          { id: "c1", name: "Backlog", tasks: [] },
          { id: "c2", name: "Concluído", tasks: [] },
        ],
      });
      mockPrisma.kanbanTask.findFirst.mockResolvedValue(null);
      mockKanbanService.createTask.mockResolvedValue({ id: "t1" });

      await service.handleActivityUpsert("a1");

      expect(mockKanbanService.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          columnId: "c1",
          title: expect.stringContaining("Palestra AI"),
          priority: "HIGH",
        }),
      );
    });

    it("should fallback to columns[0] if backlog column name not found", async () => {
      const activity = { id: "a1", eventId: "e1", title: "T", speakers: [] };
      mockPrisma.activity.findUnique.mockResolvedValue(activity);
      mockKanbanService.getBoards.mockResolvedValue([{ id: "b1" }]);
      mockKanbanService.getBoardDetails.mockResolvedValue({
        id: "b1",
        columns: [{ id: "fallback-c", name: "Outra", tasks: [] }],
      });
      await service.handleActivityUpsert("a1");
      expect(mockKanbanService.createTask).toHaveBeenCalledWith(
        expect.objectContaining({ columnId: "fallback-c" }),
      );
    });

    it("should not duplicate task if it already exists", async () => {
      const activity = {
        id: "a1",
        eventId: "e1",
        title: "Palestra AI",
        speakers: [],
        startAt: new Date(),
      };
      mockPrisma.activity.findUnique.mockResolvedValue(activity);
      mockKanbanService.getBoards.mockResolvedValue([{ id: "b1" }]);
      mockKanbanService.getBoardDetails.mockResolvedValue({
        id: "b1",
        columns: [{ id: "c1", name: "Backlog", tasks: [] }],
      });
      mockPrisma.kanbanTask.findFirst.mockResolvedValue({
        id: "existing-task",
      });

      await service.handleActivityUpsert("a1");
      expect(mockKanbanService.createTask).not.toHaveBeenCalled();
    });

    it("should move task to done when speakers are added", async () => {
      const activity = {
        id: "a1",
        eventId: "e1",
        title: "Palestra AI",
        speakers: [{ id: "s1" }],
        startAt: new Date(),
      };
      mockPrisma.activity.findUnique.mockResolvedValue(activity);
      mockKanbanService.getBoards.mockResolvedValue([{ id: "b1" }]);
      mockKanbanService.getBoardDetails.mockResolvedValue({
        id: "b1",
        columns: [
          { id: "c1", name: "Backlog", tasks: [] },
          { id: "c2", name: "Concluído", tasks: [] },
        ],
      });
      mockPrisma.kanbanTask.findFirst.mockResolvedValue({ id: "t1" });
      mockKanbanService.moveTask.mockResolvedValue({});

      await service.handleActivityUpsert("a1");
      expect(mockKanbanService.moveTask).toHaveBeenCalledWith("t1", "c2", 0);
    });

    it("should fallback to last column if done column name not found", async () => {
      const activity = {
        id: "a1",
        eventId: "e1",
        title: "T",
        speakers: [{ id: "1" }],
      };
      mockPrisma.activity.findUnique.mockResolvedValue(activity);
      mockKanbanService.getBoards.mockResolvedValue([{ id: "b1" }]);
      mockKanbanService.getBoardDetails.mockResolvedValue({
        id: "b1",
        columns: [{ id: "c1" }, { id: "last-column" }],
      });
      mockPrisma.kanbanTask.findFirst.mockResolvedValue({ id: "t1" });
      await service.handleActivityUpsert("a1");
      expect(mockKanbanService.moveTask).toHaveBeenCalledWith(
        "t1",
        "last-column",
        0,
      );
    });
  });
});
