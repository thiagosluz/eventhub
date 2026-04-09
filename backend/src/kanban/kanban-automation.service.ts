import { Injectable, Logger } from "@nestjs/common";
import { KanbanService } from "./kanban.service";
import { PrismaService } from "../prisma/prisma.service";
import { TaskPriority } from "@prisma/client";

@Injectable()
export class KanbanAutomationService {
  private readonly logger = new Logger(KanbanAutomationService.name);

  constructor(
    private readonly kanbanService: KanbanService,
    private readonly prisma: PrismaService,
  ) {}

  async handleActivityUpsert(activityId: string) {
    this.logger.log(`Checking automation for activity: ${activityId}`);

    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        speakers: true,
        event: { select: { id: true } },
      },
    });

    if (!activity) return;

    const boards = await this.kanbanService.getBoards(activity.eventId);
    const board = await this.kanbanService.getBoardDetails(boards[0].id);
    if (!board) return;
    const backlogColumn =
      board.columns.find((c) => c.name === "Backlog" || c.name === "A Fazer") ||
      board.columns[0];

    // Case 1: Missing Speakers
    if (activity.speakers.length === 0) {
      const taskTitle = `[Cronograma] Definir palestrante: ${activity.title}`;
      const externalRef = `activity:${activityId}:missing_speaker`;

      // Check if task already exists
      const existingTask = await this.prisma.kanbanTask.findFirst({
        where: {
          column: { board: { eventId: activity.eventId } },
          externalReference: externalRef,
        },
      });

      if (!existingTask) {
        await this.kanbanService.createTask({
          columnId: backlogColumn.id,
          title: taskTitle,
          description: `A atividade "${activity.title}" foi criada/editada mas ainda não possui palestrantes vinculados. Verifique se isso está correto ou defina os responsáveis.`,
          priority: TaskPriority.HIGH,
          externalReference: externalRef,
          deadline: activity.startAt,
        });
        this.logger.log(
          `Created automation task for missing speaker: ${activity.title}`,
        );
      }
    } else {
      // If speakers were added, we might want to automatically complete/delete the task
      // For now, let's keep it simple. Optimization: Remove the task if it was auto-generated and resolved.
      const existingTask = await this.prisma.kanbanTask.findFirst({
        where: { externalReference: `activity:${activityId}:missing_speaker` },
      });
      if (existingTask) {
        // Find "Concluído" column
        const doneColumn =
          board.columns.find((c) => c.name === "Concluído") ||
          board.columns[board.columns.length - 1];
        await this.kanbanService.moveTask(existingTask.id, doneColumn.id, 0);
        this.logger.log(
          `Resolved automation task for activity: ${activity.title}`,
        );
      }
    }
  }
}
