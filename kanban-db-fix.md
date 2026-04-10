# Task: Kanban Database Sync Fix

Resolve the `ColumnNotFound` error for the `color` column in the `KanbanColumn` relation.

## Tasks

- [x] **Generate and Apply Migration** (Agent: `database-architect`)
  - Run `npx prisma migrate dev --name add_kanban_column_color`
- [x] **Verify Prisma Client Synchronization** (Agent: `backend-specialist`)
  - Run `npx prisma generate`
- [x] **Smoke Test Kanban Access** (Agent: `test-engineer`)
  - Restart backend and access dashboard.

## Verification
- [x] `npx prisma migrate status`
- [x] Kanban Board loads in UI
