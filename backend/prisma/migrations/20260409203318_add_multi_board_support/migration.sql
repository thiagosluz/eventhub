-- DropIndex
DROP INDEX "KanbanBoard_eventId_key";

-- AlterTable
ALTER TABLE "KanbanBoard" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Quadro Principal';

-- CreateIndex
CREATE INDEX "KanbanBoard_eventId_idx" ON "KanbanBoard"("eventId");
