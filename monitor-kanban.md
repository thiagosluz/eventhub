# Task: Monitor Restricted Kanban

Implement a restricted Kanban board for monitors where they can see and update their assigned tasks.

## Tasks
- [ ] **Security Foundation**
    - [ ] Update `MonitorGuard` with tenant validation.
- [ ] **Backend Services**
    - [ ] Add filtered Kanban fetch in `KanbanService`.
    - [ ] Add restricted task move logic.
- [ ] **API Layer**
    - [ ] Expose monitor routes in `KanbanController`.
- [ ] **Frontend UI**
    - [ ] Create `MonitorKanbanBoard` component.
    - [ ] Create monitor task page.
    - [ ] Add dashboard navigation.
- [ ] **Testing**
    - [ ] Backend unit tests.
    - [ ] E2E monitor flow tests.

## Verification
- [ ] Tenant leak test (cross-tenant access)
- [ ] Permission test (monitor cannot edit columns)
- [ ] Task update visibility for organizers
