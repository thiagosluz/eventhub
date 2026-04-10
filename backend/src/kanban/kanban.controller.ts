import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { KanbanService } from "./kanban.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TaskPriority } from "@prisma/client";

@Controller("kanban")
@UseGuards(JwtAuthGuard)
export class KanbanController {
  constructor(private readonly kanbanService: KanbanService) {}

  // ─── Board Endpoints ───

  @Get("event/:eventId/boards")
  getBoards(@Param("eventId") eventId: string) {
    return this.kanbanService.getBoards(eventId);
  }

  @Get("board/:boardId")
  getBoardDetails(@Param("boardId") boardId: string) {
    return this.kanbanService.getBoardDetails(boardId);
  }

  @Post("board")
  createBoard(@Body() body: { eventId: string; name: string }) {
    return this.kanbanService.createBoard(body.eventId, body.name);
  }

  @Patch("board/:id")
  updateBoard(@Param("id") id: string, @Body() body: { name: string }) {
    return this.kanbanService.updateBoard(id, body.name);
  }

  @Delete("board/:id")
  deleteBoard(@Param("id") id: string) {
    return this.kanbanService.deleteBoard(id);
  }

  // ─── Column Endpoints ───

  @Post("column")
  createColumn(@Body() body: { boardId: string; name: string; color?: string }) {
    return this.kanbanService.createColumn(body.boardId, body.name, body.color);
  }

  @Patch("column/:id")
  updateColumn(
    @Param("id") id: string,
    @Body() body: { name?: string; order?: number; color?: string },
  ) {
    return this.kanbanService.updateColumn(id, body.name, body.order, body.color);
  }

  @Delete("column/:id")
  deleteColumn(@Param("id") id: string) {
    return this.kanbanService.deleteColumn(id);
  }

  @Patch("columns/reorder")
  reorderColumns(@Body() body: { boardId: string; columnIds: string[] }) {
    return this.kanbanService.reorderColumns(body.boardId, body.columnIds);
  }

  // ─── Task Endpoints ───

  @Post("task")
  createTask(
    @Body()
    body: {
      columnId: string;
      title: string;
      description?: string;
      priority?: TaskPriority;
      deadline?: string;
    },
  ) {
    return this.kanbanService.createTask({
      ...body,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
    });
  }

  @Patch("task/:id")
  updateTask(@Param("id") id: string, @Body() body: any) {
    if (body.deadline) body.deadline = new Date(body.deadline);
    return this.kanbanService.updateTask(id, body);
  }

  @Patch("task/:id/move")
  moveTask(
    @Param("id") id: string,
    @Body() body: { targetColumnId: string; order: number },
  ) {
    return this.kanbanService.moveTask(id, body.targetColumnId, body.order);
  }

  @Delete("task/:id")
  deleteTask(@Param("id") id: string) {
    return this.kanbanService.deleteTask(id);
  }

  @Post("task/:id/assign")
  assignTask(@Param("id") id: string, @Body() body: { userId: string }) {
    return this.kanbanService.assignTask(id, body.userId);
  }

  @Delete("task/:id/assign/:userId")
  unassignTask(@Param("id") id: string, @Param("userId") userId: string) {
    return this.kanbanService.unassignTask(id, userId);
  }

  @Post("task/:id/comment")
  addComment(
    @Param("id") id: string,
    @Req() req: any,
    @Body() body: { content: string },
  ) {
    return this.kanbanService.addComment(id, req.user.sub, body.content);
  }

  @Get("task/:id")
  getTaskDetails(@Param("id") id: string) {
    return this.kanbanService.getTaskDetails(id);
  }

  @Get("event/:eventId/workload")
  getWorkload(@Param("eventId") eventId: string) {
    return this.kanbanService.getWorkload(eventId);
  }
}
