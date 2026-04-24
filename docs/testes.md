# Guia de Testes — EventHub

Este documento descreve a estratégia, estrutura e execução de testes do projeto EventHub, cobrindo backend e frontend.

---

## Visão Geral

| Tipo | Backend | Frontend |
|------|---------|----------|
| **Unitários** | Jest + @nestjs/testing | Vitest + Testing Library |
| **E2E** | Jest + Supertest | Playwright |
| **Integração** | Testcontainers (MinIO, Redis) | - |
| **Performance** | k6 (scripts de carga) | - |

---

## Backend — Testes Unitários

### Execução

```bash
cd backend
npm run test              # Rodar todos
npm run test:cov          # Com relatório de cobertura
npm run test:watch        # Modo watch
npm run test:seq          # Sequencial (menos recursos)
```

### Estrutura
Testes unitários ficam ao lado dos arquivos que testam, com extensão `.spec.ts`:

```
src/auth/auth.service.spec.ts       → Testa auth.service.ts
src/events/events.service.spec.ts   → Testa events.service.ts
src/checkin/checkin.service.spec.ts  → Testa checkin.service.ts
```

### Cobertura Atual (Meta: >90%)

| Serviço | Cobertura | Módulo |
|---------|:---------:|--------|
| CheckoutService | 100.0% | checkout |
| FormsService | 96.8% | forms |
| AnalyticsService | 95.8% | analytics |
| SponsorsService | 95.6% | sponsors |
| UsersService | 95.5% | users |
| SpeakersService | 93.8% | speakers |
| CheckinService | 91.9% | checkin |
| EventsService | 91.3% | events |
| BadgesService | 91.2% | badges |

### Serviços Testados

| Módulo | Arquivo de Teste | O que cobre |
|--------|-----------------|-------------|
| **Auth** | `auth.service.spec.ts`, `auth.controller.spec.ts` | Login, registro, refresh, recuperação de senha |
| **Auth (Guards)** | `roles.guard.spec.ts`, `monitor.guard.spec.ts`, `jwt.strategy.spec.ts` | RBAC, permissões de monitor |
| **Events** | `events.service.spec.ts`, `events.controller.spec.ts` | CRUD, filtros, participantes |
| **Activities** | `activities.service.spec.ts`, `activities.controller.spec.ts`, `activities.processor.spec.ts` | CRUD, inscrições, processador BullMQ |
| **Checkin** | `checkin.service.spec.ts`, `checkin.controller.spec.ts` | Check-in, QR Code, sorteios, undo |
| **Checkout** | `checkout.service.spec.ts`, `free-ticket.strategy.spec.ts` | Inscrição, strategy pattern |
| **Certificates** | `certificate-pdf.service.spec.ts`, `certificate-templates.service.spec.ts`, `certificates.controller.spec.ts` | Templates, emissão, PDF |
| **Submissions** | `submissions.service.spec.ts`, `submissions.controller.spec.ts`, `submission-config.service.spec.ts`, `submission-config.controller.spec.ts` | Envio, revisão, configuração |
| **Reviewer Management** | `reviewer-management.service.spec.ts`, `reviewer-management.controller.spec.ts` | Convites, designação |
| **Badges** | `badges.service.spec.ts`, `badges.controller.spec.ts` | Triggers, resgate, automação |
| **Gamification** | `gamification.service.spec.ts` | XP, níveis, daily limit, spike detection (ver [gamificacao-testes.md](gamificacao-testes.md)) |
| **Analytics** | `analytics.service.spec.ts`, `analytics.controller.spec.ts` | Agregações, gráficos, participantes |
| **Dashboard** | `dashboard.service.spec.ts`, `dashboard.controller.spec.ts` | Métricas do tenant |
| **Users** | `users.service.spec.ts`, `users.controller.spec.ts`, `public-users.controller.spec.ts` | Perfil, avatar, perfil público |
| **Tenants** | `tenants.service.spec.ts`, `tenants.controller.spec.ts` | Dados públicos, branding |
| **Sponsors** | `sponsors.service.spec.ts` | Categorias, sponsors |
| **Forms** | `forms.service.spec.ts` | Sincronização de campos |
| **Mail** | `mail.service.spec.ts`, `mail.processor.spec.ts` | Enfileiramento, processamento |
| **Storage** | `minio.service.spec.ts` | Upload, buckets |
| **Staff** | `staff-management.service.spec.ts`, `staff-management.controller.spec.ts` | Monitores |
| **Submissions Processor** | `submissions.processor.spec.ts` | Distribuição automática de revisões |

---

## Backend — Testes E2E

### Execução

```bash
cd backend
npm run test:e2e
```

### Suites E2E Implementadas

| Arquivo | Módulo | O que testa |
|---------|--------|-------------|
| `app.e2e-spec.ts` | Geral | Health check |
| `auth.e2e-spec.ts` | Auth | Registro e login |
| `auth-advanced.e2e-spec.ts` | Auth | Refresh, logout, recuperação de senha |
| `events.e2e-spec.ts` | Events | CRUD, exportação CSV, uploads, portal público |
| `activities.e2e-spec.ts` | Activities | Ciclo de vida completo, inscrições, palestrantes |
| `checkout.e2e-spec.ts` | Checkout | Inscrição e prevenção de duplicatas |
| `checkin.e2e-spec.ts` | Checkin | QR Code, check-in + gamificação, sorteios |
| `submissions.e2e-spec.ts` | Submissions | Envio, listagem, revisão |
| `certificates.e2e-spec.ts` | Certificates | Emissão, listagem, validação pública |
| `dashboard.e2e-spec.ts` | Dashboard | Métricas e bloqueio de acesso |
| `users.e2e-spec.ts` | Users | Perfil, senha, listagem, avatar |
| `tenants.e2e-spec.ts` | Tenants | Dados públicos, branding |
| `speakers.e2e-spec.ts` | Speakers | Criação e perfil |
| `sponsors.e2e-spec.ts` | Sponsors | Categorias e listagem |
| `badges.e2e-spec.ts` | Badges | Criação, resgate, conquistas |
| `analytics.e2e-spec.ts` | Analytics | Relatórios e participantes |
| `forms.e2e-spec.ts` | Forms | Visualização e edição |
| `security.e2e-spec.ts` | Security | Bloqueio cross-tenant |
| `gamification-shielding.e2e-spec.ts` | Gamification | Concorrência + `uniqueKey` + teto diário sob carga |

---

## Backend — Testes de Integração (Testcontainers)

Testes que utilizam containers Docker reais para validar integrações:

| Teste | Container | O que valida |
|-------|-----------|-------------|
| `storage-integration.spec.ts` | MinIO | Criação de buckets, upload, persistência |
| `redis-integration.spec.ts` | Redis | Conexão BullMQ, processamento de jobs |

> **Requisito**: Docker deve estar rodando para estes testes.

---

## Backend — Testes de Performance (k6)

Scripts de carga localizados em `test/performance/`:

| Script | Cenário |
|--------|---------|
| `load-test-checkout.js` | Alta concorrência no checkout |
| `load-test-checkin.js` | Leitura de ingressos em massa |
| `stress-test-tenancy.js` | Carga paralela multi-tenant |

### Execução

```bash
# Instale o k6 primeiro: https://k6.io/docs/get-started/installation/
k6 run test/performance/load-test-checkout.js
```

---

## Frontend — Testes Unitários (Vitest)

### Execução

```bash
cd frontend
npm run test          # Rodar testes
npm run test:watch    # Modo watch
npm run test:coverage # Com cobertura
```

### Configuração
- **Framework**: Vitest 4.x
- **Ambiente**: jsdom
- **Libraries**: @testing-library/react, @testing-library/jest-dom, @testing-library/user-event
- **Config**: `vitest.config.ts`
- **Setup**: `src/test-setup.ts`

---

## Frontend — Testes E2E (Playwright)

### Execução

```bash
cd frontend
npm run test:e2e           # Rodar testes E2E
npx playwright test --ui   # Interface gráfica
```

### Configuração
- **Framework**: Playwright 1.58
- **Config**: `playwright.config.ts`
- **Diretório**: `e2e/`
- **Relatórios**: `playwright-report/`

---

## Melhores Práticas

### Padrão AAA (Arrange-Act-Assert)
```typescript
describe('MyService', () => {
  it('should do something', () => {
    // Arrange: Preparar dados e mocks
    const input = { name: 'Test' };
    
    // Act: Executar a ação
    const result = service.process(input);
    
    // Assert: Verificar resultado
    expect(result).toBe(expectedValue);
  });
});
```

### Regras de Mock
1. **Sempre** faça mock de serviços externos em testes unitários (DB, APIs, filas).
2. Cada teste deve ser **independente**.
3. Use nomes **descritivos** nos `describe` e `it`.
4. O `beforeEach` deve recriar o módulo de teste limpo.

### Exemplo de Teste Unitário (Backend)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from './my.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MyService', () => {
  let service: MyService;
  let prisma: PrismaService;

  const mockPrisma = {
    myModel: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MyService>(MyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return items', async () => {
    mockPrisma.myModel.findMany.mockResolvedValue([{ id: '1' }]);
    const result = await service.findAll();
    expect(result).toHaveLength(1);
  });
});
```

---

## Solução de Problemas

### Sistema travando durante os testes
- Use `--maxWorkers=2` (já configurado por padrão).
- Rode sequencialmente: `npm run test:seq`.
- Verifique uso de memória: `--logHeapUsage` (já habilitado).
- Docker: Aloque pelo menos **4GB de RAM** para containers.

### Testes E2E falhando
- Verifique se o backend e o banco de dados estão rodando.
- Para testes de integração, verifique se o Docker está ativo.
- Limpe resultados antigos: `rm -rf test-results/ playwright-report/`

---

## Roadmap de Testes

### Próximas Melhorias

| Prioridade | Melhoria |
|:----------:|----------|
| Alta | Integração real de e-mail com Testcontainers (Mailhog) |
| Alta | Upload/delete de arquivos E2E com MinIO real |
| Média | Testes de Rate Limiting |
| Média | Testes de 2FA quando implementado |
| Baixa | Testes de acessibilidade (a11y) no frontend |
| Baixa | Snapshot tests para componentes visuais críticos |
