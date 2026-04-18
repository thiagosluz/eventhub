# Organizer Materials Integration Plan

This plan was created by the `project-planner` agent to satisfy Phase 1 of the Orchestration Mode.

## Goal
Add the capability for Event Organizers to upload and remove materials for any activity directly from the dashboard programming grid.

## Implementation Details

### BACKEND (`backend-specialist`)
1. **`backend/src/activities/activities.service.ts`**
   - Add `addMaterial(tenantId, activityId, data)` method.
   - Add `removeMaterial(tenantId, activityId, materialId)` method.
   
2. **`backend/src/activities/activities.controller.ts`**
   - Bind `POST activities/:activityId/materials` `@Roles(UserRole.ORGANIZER)`.
   - Bind `DELETE activities/:activityId/materials/:materialId` `@Roles(UserRole.ORGANIZER)`.

### FRONTEND (`frontend-specialist`)
3. **`frontend/src/services/activities.service.ts`**
   - Bind API methods `addActivityMaterial(activityId, data)` & `removeActivityMaterial(activityId, materialId)`.
   
4. **`frontend/src/app/dashboard/events/[id]/activities/page.tsx`**
   - Render `materials` array in Activity Card UI.
   - Embed `<ConfirmationModal>` and Add Material Modals for Event Organizers.
   - Implement `handleDeleteMaterial` & `handleAddMaterial`.

### TESTING (`test-engineer`)
5. Validate Endpoints and UI integrity using integration checks and script scanners (`security_scan.py`, `lint_runner.py`).
