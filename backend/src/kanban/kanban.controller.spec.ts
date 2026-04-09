import { Test, TestingModule } from "@nestjs/testing";
import { KanbanController } from "./kanban.controller";
import { KanbanService } from "./kanban.service";

describe("KanbanController", () => {
  let controller: KanbanController;

  const mockService = {
    getBoards: jest.fn(),
    getBoardDetails: jest.fn(),
    createBoard: jest.fn(),
    updateBoard: jest.fn(),
    deleteBoard: jest.fn(),
    createColumn: jest.fn(),
    updateColumn: jest.fn(),
    deleteColumn: jest.fn(),
    reorderColumns: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    moveTask: jest.fn(),
    deleteTask: jest.fn(),
    assignTask: jest.fn(),
    unassignTask: jest.fn(),
    addComment: jest.fn(),
    getTaskDetails: jest.fn(),
    getWorkload: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KanbanController],
      providers: [{ provide: KanbanService, useValue: mockService }],
    }).compile();

    controller = module.get<KanbanController>(KanbanController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // ─── Board Endpoints ───

  describe("getBoards", () => {
    it("should call service.getBoards with eventId", async () => {
      mockService.getBoards.mockResolvedValue([]);
      await controller.getBoards("e1");
      expect(mockService.getBoards).toHaveBeenCalledWith("e1");
    });
  });

  describe("getBoardDetails", () => {
    it("should call service.getBoardDetails with boardId", async () => {
      mockService.getBoardDetails.mockResolvedValue({ id: "b1" });
      await controller.getBoardDetails("b1");
      expect(mockService.getBoardDetails).toHaveBeenCalledWith("b1");
    });
  });

  describe("createBoard", () => {
    it("should pass eventId and name to service", async () => {
      mockService.createBoard.mockResolvedValue({ id: "b1" });
      await controller.createBoard({ eventId: "e1", name: "Marketing" });
      expect(mockService.createBoard).toHaveBeenCalledWith("e1", "Marketing");
    });
  });

  describe("updateBoard", () => {
    it("should pass id and name to service", async () => {
      mockService.updateBoard.mockResolvedValue({ id: "b1" });
      await controller.updateBoard("b1", { name: "Novo Nome" });
      expect(mockService.updateBoard).toHaveBeenCalledWith("b1", "Novo Nome");
    });
  });

  describe("deleteBoard", () => {
    it("should call service.deleteBoard with id", async () => {
      mockService.deleteBoard.mockResolvedValue({ id: "b1" });
      await controller.deleteBoard("b1");
      expect(mockService.deleteBoard).toHaveBeenCalledWith("b1");
    });
  });

  // ─── Column Endpoints ───

  describe("createColumn", () => {
    it("should pass boardId and name to service", async () => {
      mockService.createColumn.mockResolvedValue({ id: "c1" });
      await controller.createColumn({ boardId: "b1", name: "Backlog" });
      expect(mockService.createColumn).toHaveBeenCalledWith("b1", "Backlog");
    });
  });

  describe("reorderColumns", () => {
    it("should pass boardId and columnIds to service", async () => {
      mockService.reorderColumns.mockResolvedValue([]);
      await controller.reorderColumns({
        boardId: "b1",
        columnIds: ["c2", "c1"],
      });
      expect(mockService.reorderColumns).toHaveBeenCalledWith("b1", [
        "c2",
        "c1",
      ]);
    });
  });

  // ─── Task Endpoints ───

  describe("createTask", () => {
    it("should convert deadline string to Date", async () => {
      mockService.createTask.mockResolvedValue({ id: "t1" });
      await controller.createTask({
        columnId: "c1",
        title: "Tarefa",
        deadline: "2026-04-10T12:00:00",
      });
      expect(mockService.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          columnId: "c1",
          title: "Tarefa",
          deadline: expect.any(Date),
        }),
      );
    });

    it("should pass undefined deadline when not provided", async () => {
      mockService.createTask.mockResolvedValue({ id: "t1" });
      await controller.createTask({ columnId: "c1", title: "Tarefa" });
      expect(mockService.createTask).toHaveBeenCalledWith(
        expect.objectContaining({ deadline: undefined }),
      );
    });
  });

  describe("addComment", () => {
    it("should use req.user.sub as userId", async () => {
      mockService.addComment.mockResolvedValue({ id: "cm1" });
      const req = { user: { sub: "user-123" } };
      await controller.addComment("t1", req, { content: "Olá" });
      expect(mockService.addComment).toHaveBeenCalledWith(
        "t1",
        "user-123",
        "Olá",
      );
    });
  });

  describe("moveTask", () => {
    it("should pass taskId, targetColumnId and order", async () => {
      mockService.moveTask.mockResolvedValue({ id: "t1" });
      await controller.moveTask("t1", { targetColumnId: "c2", order: 0 });
      expect(mockService.moveTask).toHaveBeenCalledWith("t1", "c2", 0);
    });
  });

  describe("getWorkload", () => {
    it("should call service.getWorkload with eventId", async () => {
      mockService.getWorkload.mockResolvedValue([]);
      await controller.getWorkload("e1");
      expect(mockService.getWorkload).toHaveBeenCalledWith("e1");
    });
  });
});
