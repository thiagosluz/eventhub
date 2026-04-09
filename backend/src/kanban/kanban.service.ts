import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TaskPriority } from "@prisma/client";

@Injectable()
export class KanbanService {
  constructor(private readonly prisma: PrismaService) {}
  private boardInclude = {
    columns: {
      orderBy: { order: "asc" as const },
      include: {
        tasks: {
          orderBy: { order: "asc" as const },
          include: {
            assignments: {
              include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
              },
            },
            _count: { select: { comments: true } },
          },
        },
      },
    },
  };

  async getBoards(eventId: string) {
    const boards = await this.prisma.kanbanBoard.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        eventId: true,
        createdAt: true,
        _count: { select: { columns: true } },
      },
    });

    if (boards.length === 0) {
      const board = await this.prisma.kanbanBoard.create({
        data: {
          eventId,
          name: "Quadro Principal",
          columns: {
            create: [
              { name: "Backlog", order: 0 },
              { name: "A Fazer", order: 1 },
              { name: "Em Andamento", order: 2 },
              { name: "Concluído", order: 3 },
            ],
          },
        },
        select: {
          id: true,
          name: true,
          eventId: true,
          createdAt: true,
          _count: { select: { columns: true } },
        },
      });
      return [board];
    }

    return boards;
  }

  async getBoardDetails(boardId: string) {
    return this.prisma.kanbanBoard.findUnique({
      where: { id: boardId },
      include: this.boardInclude,
    });
  }

  async createBoard(eventId: string, name: string) {
    return this.prisma.kanbanBoard.create({
      data: {
        eventId,
        name,
        columns: {
          create: [
            { name: "A Fazer", order: 0 },
            { name: "Em Andamento", order: 1 },
            { name: "Concluído", order: 2 },
          ],
        },
      },
      select: {
        id: true,
        name: true,
        eventId: true,
        createdAt: true,
        _count: { select: { columns: true } },
      },
    });
  }

  async updateBoard(id: string, name: string) {
    return this.prisma.kanbanBoard.update({
      where: { id },
      data: { name },
    });
  }

  async deleteBoard(id: string) {
    return this.prisma.kanbanBoard.delete({ where: { id } });
  }

  async createColumn(boardId: string, name: string) {
    const lastColumn = await this.prisma.kanbanColumn.findFirst({
      where: { boardId },
      orderBy: { order: "desc" },
    });

    return this.prisma.kanbanColumn.create({
      data: {
        boardId,
        name,
        order: lastColumn ? lastColumn.order + 1 : 0,
      },
    });
  }

  async updateColumn(id: string, name?: string, order?: number) {
    return this.prisma.kanbanColumn.update({
      where: { id },
      data: { name, order },
    });
  }

  async deleteColumn(id: string) {
    return this.prisma.kanbanColumn.delete({ where: { id } });
  }

  async reorderColumns(_boardId: string, columnIds: string[]) {
    const updates = columnIds.map((id, index) =>
      this.prisma.kanbanColumn.update({
        where: { id },
        data: { order: index },
      }),
    );
    return this.prisma.$transaction(updates);
  }

  async createTask(params: {
    columnId: string;
    title: string;
    description?: string;
    priority?: TaskPriority;
    deadline?: Date;
    externalReference?: string;
  }) {
    const lastTask = await this.prisma.kanbanTask.findFirst({
      where: { columnId: params.columnId },
      orderBy: { order: "desc" },
    });

    return this.prisma.kanbanTask.create({
      data: {
        ...params,
        order: lastTask ? lastTask.order + 1 : 0,
      },
    });
  }

  async updateTask(id: string, data: any) {
    return this.prisma.kanbanTask.update({
      where: { id },
      data,
    });
  }

  async moveTask(taskId: string, targetColumnId: string, newOrder: number) {
    return this.prisma.kanbanTask.update({
      where: { id: taskId },
      data: {
        columnId: targetColumnId,
        order: newOrder,
      },
    });
  }

  async assignTask(taskId: string, userId: string) {
    return this.prisma.taskAssignment.upsert({
      where: { taskId_userId: { taskId, userId } },
      create: { taskId, userId },
      update: {},
    });
  }

  async unassignTask(taskId: string, userId: string) {
    return this.prisma.taskAssignment.delete({
      where: { taskId_userId: { taskId, userId } },
    });
  }

  async addComment(taskId: string, userId: string, content: string) {
    return this.prisma.taskComment.create({
      data: { taskId, userId, content },
    });
  }

  async getTaskDetails(taskId: string) {
    return this.prisma.kanbanTask.findUnique({
      where: { id: taskId },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  async getWorkload(eventId: string) {
    const monitors = await this.prisma.eventMonitor.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            kanbanAssignments: {
              where: { task: { column: { board: { eventId } } } },
              include: { task: true },
            },
          },
        },
      },
    });

    return monitors.map((m: any) => ({
      userId: m.user.id,
      name: m.user.name,
      avatarUrl: m.user.avatarUrl,
      taskCount: m.user.kanbanAssignments.length,
      tasks: m.user.kanbanAssignments.map((a: any) => a.task),
    }));
  }

  async deleteTask(id: string) {
    return this.prisma.kanbanTask.delete({ where: { id } });
  }
}
