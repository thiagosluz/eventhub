# 🎼 Frontend E2E Stabilization Plan

## 1. ANALYSIS

The frontend E2E tests were executed (`npm run test:e2e` in `/frontend`) and we observed 5 failures out of 26 tests (21 passed). All failures appear to be related to either locator mismatches or timeouts waiting for specific API responses.

### Failing Tests:

**1. Dashboard - Fluxo de Check-in**
- `deve alternar para aba manual e filtrar participantes`: Timeout waiting for locator `getByPlaceholder('Busque por nome, e-mail ou código...')`.
- `deve realizar check-in manual com sucesso`: Timeout waiting for API `POST /operations/checkin`.
- `deve permitir desfazer check-in manual`: Timeout waiting for API `DELETE /operations/checkin`.

**2. Dashboard - Gestão de Participantes**
- `deve abrir o drawer de detalhes ao clicar no botão de visualizar`: Timeout waiting for `getByText('Detalhes do Participante')` to be visible.

**3. Dashboard - Submissões Científicas**
- `participante deve conseguir enviar um trabalho`: Timeout waiting for `getByPlaceholder(/Ex: Análise de Performance/i)`.

## 2. PLANNING

### Phase 1: Locator Verification & Fixes
- [ ] Inspect `frontend/src/app/(dashboard)/events/[id]/checkin/page.tsx` (or related components) to verify correct placeholder text for the search input.
- [ ] Inspect the Drawer component for Participant details to ensure the title `Detalhes do Participante` exists.
- [ ] Inspect the Scientific Submissions form to fix the placeholder for the work title.

### Phase 2: API Mock Alignment
- [ ] Investigate Playwright mock network configurations (in `frontend/e2e/support/mocks.ts` or individual spec files) for `POST /operations/checkin` and `DELETE /operations/checkin`.
- [ ] Ensure that the frontend application relies on the expected routes and that Playwright successfully intercepts them.

### Phase 3: Verification
- [ ] Run the failing Playwright tests individually to ensure the fixes resolve the issue.
- [ ] Execute `security_scan.py` and `lint_runner.py` to adhere to the Orchestration exit gate.
- [ ] Provide the synthesized orchestrator report.

## 3. SOLUTIONING

We will implement the required fixes primarily in the Playwright spec files (`dashboard-checkin.spec.ts`, `dashboard-participants.spec.ts`, `scientific-submissions.spec.ts`) and optionally in the source files if the locators were correctly defined but changed in the UI without updating the tests. Mock interceptors will also be updated.

## 4. IMPLEMENTATION (Pending Approval)

The following agents will be invoked in parallel after your approval:
- `test-engineer`: To adjust the Playwright spec locators and mock routes.
- `frontend-specialist`: To verify component IDs and texts.
- `debugger`: To trace exact root causes of the API timeouts.
