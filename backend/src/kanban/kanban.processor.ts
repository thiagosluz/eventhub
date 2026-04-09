import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { Logger } from "@nestjs/common";

@Processor("kanban-alerts")
export class KanbanAlertsProcessor extends WorkerHost {
  private readonly logger = new Logger(KanbanAlertsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === "check-deadlines") {
      await this.checkDeadlines();
    }
  }

  private async checkDeadlines() {
    this.logger.log("Checking for approaching kanban deadlines...");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const approachingTasks = await this.prisma.kanbanTask.findMany({
      where: {
        deadline: {
          lte: tomorrow,
          gte: new Date(),
        },
        column: {
          name: { not: "Concluído" }, // Skip done tasks
        },
      },
      include: {
        assignments: { include: { user: true } },
        column: { include: { board: { include: { event: true } } } },
      },
    });

    for (const task of approachingTasks) {
      this.logger.log(`Alerting for task: ${task.title}`);

      for (const assignment of task.assignments) {
        await this.mailService.enqueue({
          to: assignment.user.email,
          subject: `[Alerta] Prazo chegando: ${task.title}`,
          text: `A tarefa "${task.title}" do evento "${task.column.board.event.name}" vence em menos de 24 horas. Status atual: ${task.column.name}.`,
        });
      }
    }
  }
}
