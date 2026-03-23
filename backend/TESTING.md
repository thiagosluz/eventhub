# Guia de Testes - Backend EventHub

Este documento descreve como executar e escrever testes para o backend do EventHub.

## Requisitos

- Node.js e npm instalados.
- Dependências de desenvolvimento instaladas (`npm install`).

## Executando os Testes

Existem vários comandos disponíveis para executar os testes:

### Testes Unitários
Executa todos os testes unitários (`.spec.ts`).
```bash
npm run test
```

### Testes E2E (End-to-End)
Executa os testes de ponta a ponta (`.e2e-spec.ts`).
```bash
npm run test:e2e
```

### Cobertura de Testes
Gera um relatório de cobertura de código.
```bash
npm run test:cov
```

### Modo Watch
Executa os testes e aguarda alterações nos arquivos.
```bash
npm run test:watch
```

## Estrutura de Testes

### Testes Unitários
Os testes unitários devem ser colocados no mesmo diretório que o arquivo que está sendo testado, com a extensão `.spec.ts`.
Exemplo: `src/auth/auth.service.spec.ts` para testar `src/auth/auth.service.ts`.

### Testes E2E
Os testes E2E ficam no diretório `test/` na raiz do backend, com a extensão `.e2e-spec.ts`.
Exemplo: `test/app.e2e-spec.ts`.

## Melhores Práticas

1.  **Mocks:** Sempre faça o mock de serviços externos (como Banco de Dados, APIs de terceiros, Filas) em testes unitários para garantir que o teste seja rápido e isolado.
2.  **Independência:** Cada teste deve ser independente dos outros.
3.  **Nomenclatura:** Use nomes descritivos para seus blocos `describe` e `it`.
4.  **Arrange-Act-Assert:** Siga o padrão AAA para organizar seus testes.

## Criando um Novo Teste Unitário

Para criar um novo teste unitário para um serviço:

1.  Crie o arquivo `seu-servico.service.spec.ts`.
2.  Use o `Test.createTestingModule` do `@nestjs/testing`.
3.  Injete o serviço e seus mocks.
4.  Escreva as asserções usando `expect`.

Exemplo básico:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MyService],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

## Cobertura Atual de Testes

### Testes Unitários
- **AuthService (`auth.service.spec.ts`)**
    - `login`: Sucesso, falha por usuário inexistente, falha por senha incorreta.
- **RolesGuard (`roles.guard.spec.ts`)**
    - `canActivate`: Validação de papéis (ORGANIZER, REVIEWER, etc.) e isolamento.
- **JwtStrategy (`jwt.strategy.spec.ts`)**
    - `validate`: Extração correta de payload e validação de segredo.
- **EventsService (`events.service.spec.ts`)**
    - `createEvent`: Sucesso, falha por slug duplicado.
    - `findEventById`: Sucesso, falha por ID inexistente.
- **CheckoutService (`checkout.service.spec.ts`)**
    - `processCheckout`: Sucesso, falha por evento inexistente, falha por já inscrito.
- **FreeTicketStrategy (`free-ticket.strategy.spec.ts`)**
    - `process`: Criação correta de tickets para eventos e atividades.
- **SubmissionsService (`submissions.service.spec.ts`)**
    - `createSubmission`: Sucesso, upload de arquivo, envio de e-mail e fila BullMQ.
    - `listSubmissionsForEvent`: Sucesso, verificação de permissões do tenant.
    - `submitReview`: Sucesso, verificação de atribuição do revisor.
- **AssignReviewsProcessor (`submissions.processor.spec.ts`)**
    - `process`: Atribuição correta de revisores do tenant à submissão.
- **CertificateTemplatesService (`certificate-templates.service.spec.ts`)**
    - `create`, `findOne`, `listByEvent`: CRUD e verificação de tenant.
- **CertificatePdfService (`certificate-pdf.service.spec.ts`)**
    - `generateAndStore`: Geração de PDF com placeholders, QR Code e armazenamento.
- **CheckinService (`checkin.service.spec.ts`)**
    - `getQrCodePng`: Geração de buffer para QR Code do ingresso.
    - `checkin`: Validação de token, regras de atividade e prevenção de duplicatas.
    - `drawRaffle`: Sorteio de prêmios com regras de filtro (check-in, staff, ganhadores únicos).
- **DashboardService (`dashboard.service.spec.ts`)**
    - `getStats`: Agregação de receita, inscrições, eventos ativos e atividades recentes por tenant.
    - `getTimeSeriesData`: Geração de dados temporais dos últimos 30 dias.
- **ActivitiesService (`activities.service.spec.ts`)**
    - `createActivity`: Sucesso com auto-inscrição, falha por evento fora do tenant.
    - `enrollInActivity`: Sucesso, falha por conflito de horário, falha por capacidade atingida.
    - `updateActivity`: Sucesso, sincronização de palestrantes e auto-inscrição.
    - `deleteActivity`: Remoção completa e de associações.
    - `Activity Types`: CRUD de tipos de atividade.
    - `Enrollment Management`: Listagem e confirmação manual de inscrições.
- **ActivitiesProcessor (`activities.processor.spec.ts`)**
    - `cleanupExpiredEnrollments`: Cancelamento automático de inscrições pendentes expiradas.
- **UsersService (`src/users/users.service.spec.ts`)**
    - `findMe`: Sucesso e erro 404.
    - `updateProfile`: Sucesso (com sincronização de palestrante) e erro de e-mail duplicado.
    - `findAll`: Listagem filtrada por tenant.
- **SpeakersService (`src/speakers/speakers.service.spec.ts`)**
    - `create`: Upgrade de role de PARTICIPANT para SPEAKER.
    - `update`: Downgrade de role ao desvincular usuário e sincronização de perfil.
    - `Portal`: Listagem de atividades e feedbacks do palestrante.
- **SponsorsService (`src/sponsors/sponsors.service.spec.ts`)**
    - `Categories`: Sucesso e erro de isolamento por tenant.
    - `Sponsors`: Criação e associação correta a categorias.
- **FormsService (`src/forms/forms.service.spec.ts`)**
    - `RegistrationForm`: Recuperação e salvamento dinâmico de campos (upsert/delete).
- **TenantsService (`src/tenants/tenants.service.spec.ts`)**
    - `getTenant`: Busca por ID com erro 404.
    - `updateTenant`: Atualização de marca e tema.
    - `getPublicTenant`: Recuperação de dados públicos para o portal.
- **Prisma Filter (`src/common/filters/prisma-client-exception.filter.spec.ts`)**
    - `catch`: Mapeamento de erros Prisma (P2002, P2025) para HTTP 409 e 404.
    
## Testes de Integração Real (Testcontainers)
Para garantir que a integração com serviços externos funcione conforme o esperado em produção, utilizamos o **Testcontainers** para subir instâncias reais via Docker durante os testes:
- **MinIO Integration (`src/storage/storage-integration.spec.ts`)**:
    - Valida criação de buckets, upload de buffers e persistência real sem mocks do cliente S3.
- **Redis Integration (`src/storage/redis-integration.spec.ts`)**:
    - Valida conexões BullMQ e processamento de jobs num container Redis real.

## Documentação API (Swagger)
A API é automaticamente documentada e pode ser testada interativamente:
- **Endpoint**: `/api/docs`
- **Recursos**: Suporte a Bearer Auth, exemplos de DTOs e mapeamento de multipart/form-data para uploads.
- **Badges (`src/badges/badges.service.spec.ts`)**
    - `Gatilhos`: Atribuição automática por check-in, perfil completo e early bird.
    - `Resgate`: Validação de códigos globais e únicos.
    - `Gestão`: Criação, atualização e geração automática de lotes de códigos.
- **Analytics (`src/analytics/analytics.service.spec.ts`)**
    - `Agregações`: Cálculo de taxa de ocupação, distribuição de tipos de ingressos e status de inscrição.
    - `Temporal`: Gráficos de registros diários (janela de 14 dias).
    - `Participantes`: Mapeamento detalhado de inscritos e check-ins filtrados.
- **Mail (`src/mail/mail.service.spec.ts`, `src/mail/mail.processor.spec.ts`)**
    - `MailService`: Enfileiramento correto de e-mails com tentativas e backoff.
    - `MailProcessor`: Processamento de jobs através do Nodemailer.
- **Storage (`src/storage/minio.service.spec.ts`)**
    - `MinioService`: Garantia de existência de buckets, políticas de acesso e upload de objetos.
- **EventsController (`events.controller.spec.ts`)**
    - `createEvent`: Chamada correta ao serviço, tratamento de erro de slug.

### Testes E2E (Implementados)
- **Autenticação (`auth.e2e-spec.ts`)**: Fluxo completo de registro e login.
- **Autenticação Avançada (`auth-advanced.e2e-spec.ts`)**: Refresh tokens, logout e recuperação de senha.
- **Eventos (`events.e2e-spec.ts`)**: CRUD completo, exportação de participantes (CSV), uploads de ativos (banner/logo) e portal público.
- **Atividades (`activities.e2e-spec.ts`)**: Ciclo de vida completo (criação, inscrição, conflitos, palestrantes) e gestão de tipos de atividade.
- **Checkout (`checkout.e2e-spec.ts`)**: Fluxo de inscrição e prevenção de duplicatas.
- **Submissões (`submissions.e2e-spec.ts`)**: Envio de trabalho, listagem (por autor e revisor) e revisão.
- **Certificados (`certificates.e2e-spec.ts`)**: Emissão manual, listagem (meus) e validação pública.
- **Check-in (`checkin.e2e-spec.ts`)**: QR Code, check-in completo com gatilhos (e-mail/conquistas), sorteio de prêmios e gestão de histórico.
- **Dashboard (`dashboard.e2e-spec.ts`)**: Métricas para organizadores e bloqueio para participantes.
- **Tenants (`tenants.e2e-spec.ts`)**: Dados públicos, perfil do tenant e atualização de marca.
- **Users (`users.e2e-spec.ts`)**: Perfil do usuário, atualização de senha (argon2), listagem administrativa e upload de avatar.
- **Segurança e Isolamento (`security.e2e-spec.ts`)**: Bloqueio de acesso entre inquilinos (cross-tenant).
- **Speakers (`speakers.e2e-spec.ts`)**: Criação por organizador e perfil do palestrante.
- **Sponsors (`sponsors.e2e-spec.ts`)**: Gestão de categorias e listagem administrativa.
- **Badges (`badges.e2e-spec.ts`)**: Criação, resgate por código e conquistas.
- **Analytics (`analytics.e2e-spec.ts`)**: Relatórios e listagem de participantes.
- **Formulários (`forms.e2e-spec.ts`)**: Visualização e edição dinâmica.
- **Geral (`app.e2e-spec.ts`)**: Health check básico.

- **Implementação E2E Completa**: Todos os módulos principais agora possuem cobertura E2E mock-based (Activities, Submissions, Users, Events, Checkin, Auth, etc).
    
## Testes de Performance e Carga (k6)
Para validar a resiliência do sistema sob estresse, incluímos scripts de teste de carga em `test/performance/`:
- **Load Test Checkout (`load-test-checkout.js`)**: Simulação de alta concorrência no processo de inscrição.
- **Load Test Check-in (`load-test-checkin.js`)**: Validação de tempo de resposta para leitura de ingressos em massa.
- **Stress Test Multi-Tenancy (`stress-test-tenancy.js`)**: Simulação de carga paralela em múltiplos inquilinos.

## Dívida Técnica e Roadmap de Testes

### Módulos Pendentes (Dívida Técnica)
- Atualmente, a prioridade é a expansão da cobertura E2E para endpoints de gestão e utilidades identificados acima.

### Próximas Melhorias (Roadmap)
- **Integração de E-mail**: Testes de integração (não apenas mocks) usando Testcontainers (ex: Mailhog).
- **Integração de Storage**: Garantir que o fluxo de upload/delete de banner/avatar seja validado no E2E com MinIO real.
- **Segurança Avançada**: Testes de Rate Limiting e fluxos de 2FA.
