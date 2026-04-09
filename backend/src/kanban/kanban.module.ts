import { Module } from "@nestjs/common";
import { KanbanService } from "./kanban.service";
import { KanbanAutomationService } from "./kanban-automation.service";
import { KanbanController } from "./kanban.controller";
import { KanbanAlertsProcessor } from "./kanban.processor";
import { PrismaModule } from "../prisma/prisma.module";
import { MailModule } from "../mail/mail.module";
import { BullModule } from "@nestjs/bullmq";

@Module({
  imports: [
    PrismaModule,
    MailModule,
    BullModule.registerQueue({ name: "kanban-alerts" }),
  ],
  providers: [KanbanService, KanbanAutomationService, KanbanAlertsProcessor],
  controllers: [KanbanController],
  exports: [KanbanService, KanbanAutomationService],
})
export class KanbanModule {}
