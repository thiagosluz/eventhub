# 🎼 Backend Stabilization Plan

This plan outlines the steps to fix failing unit and E2E tests in the backend, ensuring full system stability.

## 1. ANALYSIS

The following test suites are currently failing:

### Unit Tests
- `src/users/users.service.spec.ts`: Missing dependencies (`TestingInstanceLoader` error).
- `src/events/events.controller.spec.ts`: Missing dependencies (`TestingInstanceLoader` error).
- `src/checkin/checkin.service.spec.ts`: Missing `performedByUserId` in `undoCheckin` calls.

### E2E Tests
- `test/users.e2e-spec.ts`: `PATCH /users/profile` returns 500.
- `test/checkin.e2e-spec.ts`: `POST /checkin` failure (likely due to recent schema/logic changes).
- `test/analytics.e2e-spec.ts`: `GET /analytics/events/:id` returns 500 instead of 403.

## 2. PLANNING

### Phase 1: Unit Test Stabilization
- [ ] Fix `checkin.service.spec.ts` by updating method signatures.
- [ ] Debug and fix `users.service.spec.ts` and `events.controller.spec.ts` by adding missing mocked providers.

### Phase 2: E2E Fixes & Backend Logic
- [ ] Investigate 500 errors in E2E tests for Users, Check-in, and Analytics.
- [ ] Implement fixes in service/controller logic if recent changes introduced regressions.

### Phase 3: Verification
- [ ] Run full test suite: `npm run test` and `npm run test:e2e`.
- [ ] Run security scan: `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .`.
- [ ] Run lint: `npm run lint`.

## 3. SOLUTIONING

### Checkin Module
Update `undoCheckin` usage in tests. It seems the function was updated to require the user ID of the person performing the action for auditing/gamification purposes.

### Missing Dependencies
Likely due to the introduction of `GamificationModule` or similar globally used services that were not added to the mock providers in the existing tests.

## 4. IMPLEMENTATION (Pending Approval)

The following agents will be used in parallel after approval:
- `backend-specialist`: For core logic fixes.
- `test-engineer`: For test suite stabilization.
- `debugger`: For root cause analysis of 500 errors.
