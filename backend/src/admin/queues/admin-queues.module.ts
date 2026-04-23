import { Module } from "@nestjs/common";
import { BullBoardModule } from "@bull-board/nestjs";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import type { Request, Response } from "express";
import { QUEUE_NAMES } from "../../common/bullmq/default-job-options";
import { buildBullBoardAuthMiddleware } from "./bull-board-auth.middleware";

/**
 * Expõe o Bull Board em `/admin/queues`, protegido por JWT + role
 * `SUPER_ADMIN`.
 *
 * O `BullBoardFeatureModule` localiza cada queue globalmente via
 * `ModuleRef` (com `strict: false`), então não precisamos registrar as
 * queues novamente aqui — elas são registradas em seus módulos de
 * origem (AppModule para `assign-reviews`/`activities`, MailModule para
 * `emails`, KanbanModule para `kanban-alerts`).
 *
 * Se `JWT_SECRET` não estiver configurado, o dashboard retorna 503 em
 * vez de expor filas ao público.
 */
@Module({
  imports: [
    BullBoardModule.forRoot({
      route: "/admin/queues",
      adapter: ExpressAdapter,
      middleware: process.env.JWT_SECRET
        ? buildBullBoardAuthMiddleware(process.env.JWT_SECRET, {
            allowedFrameOrigins: (
              process.env.CORS_ORIGIN ?? "http://localhost:3001"
            )
              .split(",")
              .map((o) => o.trim())
              .filter(Boolean),
          })
        : (_req: Request, res: Response) =>
            res
              .status(503)
              .send("Bull Board disabled: JWT_SECRET is not configured."),
    }),
    ...QUEUE_NAMES.map((name) =>
      BullBoardModule.forFeature({ name, adapter: BullMQAdapter }),
    ),
  ],
})
export class AdminQueuesModule {}
