import { Test, TestingModule } from "@nestjs/testing";
import { KanbanService } from "./kanban.service";
import { PrismaService } from "../prisma/prisma.service";

describe("KanbanService", () => {
  let service: KanbanService;

  const mockPrisma = {
    kanbanBoard: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    kanbanColumn: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    kanbanTask: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    taskAssignment: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    taskComment: {
      create: jest.fn(),
    },
    eventMonitor: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KanbanService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<KanbanService>(KanbanService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // ─── getBoards ───

  describe("getBoards", () => {
    it("should return existing boards", async () => {
      const boards = [
        {
          id: "b1",
          name: "Marketing",
          eventId: "e1",
          createdAt: new Date(),
          _count: { columns: 3 },
        },
      ];
      mockPrisma.kanbanBoard.findMany.mockResolvedValue(boards);

      const result = await service.getBoards("e1");
      expect(result).toEqual(boards);
      expect(mockPrisma.kanbanBoard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { eventId: "e1" } }),
      );
    });

    it("should auto-create 'Quadro Principal' if no boards exist", async () => {
      mockPrisma.kanbanBoard.findMany.mockResolvedValue([]);
      const created = {
        id: "b1",
        name: "Quadro Principal",
        eventId: "e1",
        createdAt: new Date(),
        _count: { columns: 4 },
      };
      mockPrisma.kanbanBoard.create.mockResolvedValue(created);

      const result = await service.getBoards("e1");
      expect(result).toEqual([created]);
      expect(mockPrisma.kanbanBoard.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Quadro Principal",
            eventId: "e1",
            columns: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({ name: "A Fazer", color: "blue" }),
                expect.objectContaining({
                  name: "Em Andamento",
                  color: "amber",
                }),
                expect.objectContaining({
                  name: "Concluído",
                  color: "emerald",
                }),
              ]),
            }),
          }),
        }),
      );
    });
  });

  // ─── getBoardDetails ───

  describe("getBoardDetails", () => {
    it("should return board with columns and tasks", async () => {
      const board = { id: "b1", columns: [{ id: "c1", tasks: [] }] };
      mockPrisma.kanbanBoard.findUnique.mockResolvedValue(board);

      const result = await service.getBoardDetails("b1");
      expect(result).toEqual(board);
      expect(mockPrisma.kanbanBoard.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "b1" } }),
      );
    });

    it("should return null for non-existent board", async () => {
      mockPrisma.kanbanBoard.findUnique.mockResolvedValue(null);
      const result = await service.getBoardDetails("nonexistent");
      expect(result).toBeNull();
    });
  });

  // ─── createBoard ───

  describe("createBoard", () => {
    it("should create board with default columns", async () => {
      const board = { id: "b2", name: "Financeiro", eventId: "e1" };
      mockPrisma.kanbanBoard.create.mockResolvedValue(board);

      const result = await service.createBoard("e1", "Financeiro");
      expect(result).toEqual(board);
      expect(mockPrisma.kanbanBoard.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventId: "e1",
            name: "Financeiro",
            columns: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({ name: "A Fazer", color: "blue" }),
                expect.objectContaining({
                  name: "Em Andamento",
                  color: "amber",
                }),
                expect.objectContaining({
                  name: "Concluído",
                  color: "emerald",
                }),
              ]),
            }),
          }),
        }),
      );
    });
  });

  // ─── updateBoard ───

  describe("updateBoard", () => {
    it("should rename board", async () => {
      mockPrisma.kanbanBoard.update.mockResolvedValue({
        id: "b1",
        name: "Novo Nome",
      });
      const result = await service.updateBoard("b1", "Novo Nome");
      expect((result as any).name).toBe("Novo Nome");
      expect(mockPrisma.kanbanBoard.update).toHaveBeenCalledWith({
        where: { id: "b1" },
        data: { name: "Novo Nome" },
      });
    });
  });

  // ─── deleteBoard ───

  describe("deleteBoard", () => {
    it("should delete board by id", async () => {
      mockPrisma.kanbanBoard.delete.mockResolvedValue({ id: "b1" });
      await service.deleteBoard("b1");
      expect(mockPrisma.kanbanBoard.delete).toHaveBeenCalledWith({
        where: { id: "b1" },
      });
    });
  });

  // ─── createColumn ───

  describe("createColumn", () => {
    it("should create column at position 0 when board is empty", async () => {
      mockPrisma.kanbanColumn.findFirst.mockResolvedValue(null);
      mockPrisma.kanbanColumn.create.mockResolvedValue({ id: "c1", order: 0 });

      await service.createColumn("b1", "Nova Coluna", "blue");
      expect(mockPrisma.kanbanColumn.create).toHaveBeenCalledWith({
        data: { boardId: "b1", name: "Nova Coluna", order: 0, color: "blue" },
      });
    });

    it("should create column after the last existing column", async () => {
      mockPrisma.kanbanColumn.findFirst.mockResolvedValue({ order: 3 });
      mockPrisma.kanbanColumn.create.mockResolvedValue({ id: "c2", order: 4 });

      await service.createColumn("b1", "Coluna Extra", "rose");
      expect(mockPrisma.kanbanColumn.create).toHaveBeenCalledWith({
        data: { boardId: "b1", name: "Coluna Extra", order: 4, color: "rose" },
      });
    });
  });

  // ─── updateColumn ───

  describe("updateColumn", () => {
    it("should update column name", async () => {
      mockPrisma.kanbanColumn.update.mockResolvedValue({
        id: "c1",
        name: "Renomeada",
      });
      await service.updateColumn("c1", "Renomeada", undefined, "indigo");
      expect(mockPrisma.kanbanColumn.update).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: { name: "Renomeada", order: undefined, color: "indigo" },
      });
    });
  });

  // ─── deleteColumn ───

  describe("deleteColumn", () => {
    it("should delete column by id", async () => {
      mockPrisma.kanbanColumn.delete.mockResolvedValue({ id: "c1" });
      await service.deleteColumn("c1");
      expect(mockPrisma.kanbanColumn.delete).toHaveBeenCalledWith({
        where: { id: "c1" },
      });
    });
  });

  // ─── reorderColumns ───

  describe("reorderColumns", () => {
    it("should reorder columns via $transaction", async () => {
      mockPrisma.$transaction.mockResolvedValue([]);

      await service.reorderColumns("b1", ["c3", "c1", "c2"]);
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([expect.anything()]),
      );
      // Verify individual update calls were created
      expect(mockPrisma.kanbanColumn.update).toHaveBeenCalledTimes(3);
      expect(mockPrisma.kanbanColumn.update).toHaveBeenCalledWith({
        where: { id: "c3" },
        data: { order: 0 },
      });
      expect(mockPrisma.kanbanColumn.update).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: { order: 1 },
      });
      expect(mockPrisma.kanbanColumn.update).toHaveBeenCalledWith({
        where: { id: "c2" },
        data: { order: 2 },
      });
    });
  });

  // ─── createTask ───

  describe("createTask", () => {
    it("should create task at position 0 when column is empty", async () => {
      mockPrisma.kanbanTask.findFirst.mockResolvedValue(null);
      mockPrisma.kanbanTask.create.mockResolvedValue({ id: "t1", order: 0 });

      await service.createTask({ columnId: "c1", title: "Tarefa 1" });
      expect(mockPrisma.kanbanTask.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          columnId: "c1",
          title: "Tarefa 1",
          order: 0,
        }),
      });
    });

    it("should create task after the last existing task", async () => {
      mockPrisma.kanbanTask.findFirst.mockResolvedValue({ order: 5 });
      mockPrisma.kanbanTask.create.mockResolvedValue({ id: "t2", order: 6 });

      await service.createTask({ columnId: "c1", title: "Tarefa 2" });
      expect(mockPrisma.kanbanTask.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ order: 6 }),
      });
    });
  });

  // ─── moveTask ───

  describe("moveTask", () => {
    it("should move task to target column with new order", async () => {
      mockPrisma.kanbanTask.update.mockResolvedValue({
        id: "t1",
        columnId: "c2",
        order: 0,
      });

      await service.moveTask("t1", "c2", 0);
      expect(mockPrisma.kanbanTask.update).toHaveBeenCalledWith({
        where: { id: "t1" },
        data: { columnId: "c2", order: 0 },
      });
    });
  });

  // ─── assignTask / unassignTask ───

  describe("assignTask", () => {
    it("should upsert task assignment", async () => {
      mockPrisma.taskAssignment.upsert.mockResolvedValue({
        taskId: "t1",
        userId: "u1",
      });

      await service.assignTask("t1", "u1");
      expect(mockPrisma.taskAssignment.upsert).toHaveBeenCalledWith({
        where: { taskId_userId: { taskId: "t1", userId: "u1" } },
        create: { taskId: "t1", userId: "u1" },
        update: {},
      });
    });
  });

  describe("unassignTask", () => {
    it("should delete task assignment", async () => {
      mockPrisma.taskAssignment.delete.mockResolvedValue({});

      await service.unassignTask("t1", "u1");
      expect(mockPrisma.taskAssignment.delete).toHaveBeenCalledWith({
        where: { taskId_userId: { taskId: "t1", userId: "u1" } },
      });
    });
  });

  // ─── addComment ───

  describe("addComment", () => {
    it("should create comment with userId", async () => {
      mockPrisma.taskComment.create.mockResolvedValue({
        id: "cm1",
        content: "Oi",
      });

      await service.addComment("t1", "u1", "Oi");
      expect(mockPrisma.taskComment.create).toHaveBeenCalledWith({
        data: { taskId: "t1", userId: "u1", content: "Oi" },
      });
    });
  });

  // ─── getWorkload ───

  describe("getWorkload", () => {
    it("should return mapped workload per monitor", async () => {
      mockPrisma.eventMonitor.findMany.mockResolvedValue([
        {
          user: {
            id: "u1",
            name: "Ana",
            avatarUrl: null,
            kanbanAssignments: [
              { task: { id: "t1", title: "Task 1" } },
              { task: { id: "t2", title: "Task 2" } },
            ],
          },
        },
      ]);

      const result = await service.getWorkload("e1");
      expect(result).toEqual([
        {
          userId: "u1",
          name: "Ana",
          avatarUrl: null,
          taskCount: 2,
          tasks: [
            { id: "t1", title: "Task 1" },
            { id: "t2", title: "Task 2" },
          ],
        },
      ]);
    });
  });

  // ─── deleteTask ───

  describe("deleteTask", () => {
    it("should delete task by id", async () => {
      mockPrisma.kanbanTask.delete.mockResolvedValue({ id: "t1" });
      await service.deleteTask("t1");
      expect(mockPrisma.kanbanTask.delete).toHaveBeenCalledWith({
        where: { id: "t1" },
      });
    });
  });

  // ─── monitorSpecific ───

  describe("monitorSpecific", () => {
    describe("getBoardDetailsForMonitor", () => {
      it("should return board with tasks filtered by monitor assignments", async () => {
        const board = { id: "b1", columns: [{ id: "c1", tasks: [] }] };
        mockPrisma.kanbanBoard.findUnique.mockResolvedValue(board);

        const result = await service.getBoardDetailsForMonitor("b1", "u1");
        expect(result).toEqual(board);
        expect(mockPrisma.kanbanBoard.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({
            include: expect.objectContaining({
              columns: expect.objectContaining({
                include: expect.objectContaining({
                  tasks: expect.objectContaining({
                    where: { assignments: { some: { userId: "u1" } } },
                  }),
                }),
              }),
            }),
          }),
        );
      });
    });

    describe("moveTaskByMonitor", () => {
      it("should move task if assigned to monitor", async () => {
        mockPrisma.taskAssignment.findUnique.mockResolvedValue({
          taskId: "t1",
          userId: "u1",
        });
        mockPrisma.kanbanTask.update.mockResolvedValue({ id: "t1" });

        await service.moveTaskByMonitor("t1", "c2", "u1");
        expect(mockPrisma.kanbanTask.update).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: "t1" } }),
        );
      });

      it("should throw ForbiddenException if task is not assigned to monitor", async () => {
        mockPrisma.taskAssignment.findUnique.mockResolvedValue(null);

        await expect(
          service.moveTaskByMonitor("t1", "c2", "u1"),
        ).rejects.toThrow("Acesso negado");
      });
    });
  });
});
