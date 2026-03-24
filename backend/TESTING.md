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

### Resumo da Cobertura de Meta (>90%)

Conseguimos atingir a meta de mais de 90% de cobertura unitária em todos os 9 serviços principais do backend:

| Serviço | Cobertura de Linhas | Principais Garantias |
|---------|---------------------|----------------------|
| **CheckoutService** | 100.0% | Fluxo completo de inscrição e validação de formulários. |
| **FormsService** | 96.8% | Sincronização dinâmica de campos e deleção segura. |
| **AnalyticsService** | 95.8% | Cálculos temporais e agregações complexas de participantes. |
| **SponsorsService** | 95.6% | Isolamento de tenant e gestão de categorias/logos. |
| **UsersService** | 95.5% | Segurança de hashes (Argon2), avatars e badges de perfil. |
| **SpeakersService** | 93.8% | Portal do palestrante e sincronização de atividades/materiais. |
| **CheckinService** | 91.9% | Sorteios (Raffles) e validação de check-ins duplicados. |
| **EventsService** | 91.3% | Filtros avançados de participantes e gestão de tenants. |
| **BadgesService** | 91.2% | Gatilhos de automação e resgate via scan/código único. |

### Autenticação e Sessão
- **Backend**: Endpoint `/auth/refresh` implementado para permitir a renovação de tokens JWT sem nova autenticação manual.
- **Acesso Híbrido**: Usuários com perfil `ORGANIZER` podem acessar funcionalidades de `SPEAKER` se houver um perfil de palestrante vinculado (validado via flag `isSpeaker` no JWT).
- **Frontend**: Cliente API configurado para realizar o *Silent Refresh*, renovando o `access_token` (15min) automaticamente usando o `refresh_token` (7 dias).

---
    
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
## Solução de Problemas (Troubleshooting)

### Travamento do Sistema / Exaustão de Recursos
Se o seu computador travar ao executar os testes, isso provavelmente se deve ao alto consumo de CPU e RAM pelo Jest ao rodar múltiplos testes em paralelo com o NestJS e Docker (Testcontainers).

Para resolver, siga estas recomendações:

1.  **Limite de Workers:** Os scripts padrão já foram atualizados para usar `--maxWorkers=2`.
2.  **Execução Sequencial:** Se o sistema ainda estiver lento, utilize o comando para rodar um arquivo por vez:
    ```bash
    npm run test:seq
    ```
3.  **Logs de Memória:** O script `npm run test` agora inclui `--logHeapUsage` para ajudar a identificar vazamentos de memória.
4.  **Docker:** Certifique-se de que o Docker Desktop (ou equivalente) tenha recursos suficientes alocados (pelo menos 4GB de RAM recomendados).
