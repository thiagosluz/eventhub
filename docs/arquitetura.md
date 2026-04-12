# Arquitetura do Sistema EventHub

Este documento descreve a arquitetura técnica completa da plataforma **EventHub** — um sistema multi-tenant para gestão de eventos acadêmicos e corporativos.

---

## Visão Geral

O EventHub é uma plataforma web composta por dois projetos independentes:

| Componente | Tecnologia | Porta Padrão | Descrição |
|------------|------------|:------------:|-----------|
| **Backend (API)** | NestJS + Prisma + PostgreSQL | 3000 | API REST com autenticação JWT, RBAC e Swagger |
| **Frontend (Web)** | Next.js 16 + React 19 + Tailwind CSS 4 | 3001 | Interface web com SSR e client-side rendering |
| **Banco de Dados** | PostgreSQL 16 (Docker) | 5432 | Banco relacional com Prisma ORM |
| **Cache / Filas** | Redis 7 (Docker) | 6379 | Filas assíncronas via BullMQ |
| **Object Storage** | MinIO (Docker) | 9000 / 9001 | Armazenamento de arquivos (S3-compatible) |

```
┌─────────────────────────────────────────────────────────────────┐
│                        NAVEGADOR (Usuário)                      │
│                                                                 │
│    ┌─────────────────────────────────────────────────────┐      │
│    │          FRONTEND — Next.js 16 (React 19)           │      │
│    │   Port: 3001 │ SSR + CSR + Tailwind CSS v4          │      │
│    └──────────────────────┬──────────────────────────────┘      │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTP (REST API)
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                  BACKEND — NestJS 11 (Node.js)                    │
│                   Port: 3000 │ JWT + RBAC                         │
│                                                                   │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │   Auth   │  │   Events   │  │  Checkin  │  │ Gamification  │  │
│  │  Module  │  │   Module   │  │  Module   │  │    Module     │  │
│  └──────────┘  └────────────┘  └──────────┘  └───────────────┘  │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Certific.│  │Submissions │  │ Sponsors │  │   Analytics   │  │
│  │  Module  │  │   Module   │  │  Module   │  │    Module     │  │
│  └──────────┘  └────────────┘  └──────────┘  └───────────────┘  │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Badges  │  │    Mail    │  │  Staff   │  │   Dashboard   │  │
│  │  Module  │  │   Module   │  │  Module   │  │    Module     │  │
│  └──────────┘  └────────────┘  └──────────┘  └───────────────┘  │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Users   │  │  Tenants   │  │  Forms   │  │   Storage     │  │
│  │  Module  │  │   Module   │  │  Module   │  │    Module     │  │
│  └──────────┘  └────────────┘  └──────────┘  └───────────────┘  │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐                     │
│  │ Speakers │  │  Checkout  │  │ Activit. │                     │
│  │  Module  │  │   Module   │  │  Module   │                     │
│  └──────────┘  └────────────┘  └──────────┘                     │
└───────────┬──────────────┬──────────────┬────────────────────────┘
            │              │              │
            ▼              ▼              ▼
    ┌──────────────┐ ┌──────────┐ ┌──────────────┐
    │  PostgreSQL  │ │  Redis   │ │    MinIO      │
    │   Port 5432  │ │ Port 6379│ │ Ports 9000/01 │
    └──────────────┘ └──────────┘ └──────────────┘
```

---

## Multi-Tenancy

O EventHub utiliza o modelo **Row-Level Multi-Tenancy**, onde todos os tenants compartilham o mesmo banco de dados, mas os dados são isolados por `tenantId` em cada tabela relevante.

- Cada **Organizer** possui um `Tenant` (organização).
- **Eventos**, **Speakers**, **Badges** e outros recursos são scoped pelo `tenantId`.
- Validações de tenant são feitas em nível de serviço para garantir isolamento.

### Fluxo de Dados por Tenant

```
Tenant (Organização)
  ├── Users (membros do tenant)
  ├── Events (eventos do tenant)
  │     ├── Activities (programação)
  │     ├── Registrations (inscrições)
  │     ├── Tickets (ingressos)
  │     ├── Submissions (trabalhos científicos)
  │     ├── Certificates (certificados)
  │     ├── Sponsors (patrocinadores)
  │     ├── Badges (conquistas)
  │     └── Raffles (sorteios)
  ├── Speakers (palestrantes do tenant)
  ├── Activity Types (tipos de atividade)
  └── Speaker Roles (papéis de palestrantes)
```

---

## Autenticação e Autorização

### Stack de Autenticação

| Componente | Tecnologia | Detalhes |
|------------|------------|----------|
| **Hash de Senha** | Argon2 | Via biblioteca `argon2` |
| **Tokens** | JWT (JSON Web Tokens) | Access (15min) + Refresh (7 dias) |
| **Strategy** | Passport.js + JWT Strategy | Integração via `@nestjs/passport` |
| **Guards** | `JwtAuthGuard`, `RolesGuard`, `MonitorGuard` | Proteção de rotas |

### Roles do Sistema (RBAC)

| Role | Permissões |
|------|------------|
| **SUPER_ADMIN** | Acesso global (cross-tenant), gestão de inquilinos, auditoria global, impersonate |
| **ORGANIZER** | Gestão completa do tenant: eventos, atividades, participantes, certificados, sorteios, configurações |
| **REVIEWER** | Revisão de trabalhos científicos (submissions), acesso ao painel de revisão |
| **SPEAKER** | Portal do palestrante, perfil, materiais de atividades |
| **PARTICIPANT** | Inscrição em eventos, visualização de ingressos/certificados, perfil público |

### Fluxo de Autenticação

```
Login → access_token (15min) + refresh_token (7d)
         │
         ├─ Token expirado (401) → Client intercepta
         │    └─ POST /auth/refresh { refresh_token }
         │         └─ Novos tokens → Retry da requisição original
         │
         └─ Refresh inválido → Logout automático → Redirect /auth/login
```

### Recursos Adicionais de Auth

- **Recuperação de senha**: Envio de token por e-mail (válido por 1h)
- **Troca forçada de senha**: Flag `mustChangePassword` redireciona para tela de alteração
- **Acesso híbrido**: Organizadores podem ter perfil de Speaker vinculado (flag `isSpeaker` no JWT)

---

## Estrutura de Diretórios

### Backend (`/backend`)

```
backend/
├── prisma/
│   ├── schema.prisma         # Schema do banco de dados (752 linhas)
│   ├── seed.ts               # Dados iniciais (4 usuários, 1 evento, palestrantes)
│   └── migrations/           # Histórico de migrações
├── src/
│   ├── main.ts               # Entry point (CORS, Swagger, Filters)
│   ├── app.module.ts          # Módulo raiz (importa todos os módulos)
│   ├── generated/prisma/     # Client Prisma gerado
│   ├── common/
│   │   ├── filters/          # PrismaClientExceptionFilter
│   │   ├── interceptors/     # ResponseInterceptor
│   │   └── pipes/            # CustomValidationPipe
│   ├── auth/                 # Autenticação (JWT, Guards, Roles)
│   ├── events/               # CRUD de eventos
│   ├── activities/           # Atividades + Inscrições + Processador BullMQ
│   ├── users/                # Perfil, avatar, listagem
│   ├── checkin/              # Check-in (QR Code) + Sorteios
│   ├── checkout/             # Inscrição em eventos (Strategy Pattern)
│   ├── certificates/         # Templates + Emissão de certificados PDF
│   ├── submissions/          # Trabalhos científicos + Revisão
│   ├── gamification/         # Sistema de XP, Níveis e Alertas
│   ├── badges/               # Conquistas (manual, automática, códigos)
│   ├── analytics/            # Relatórios e métricas de eventos
│   ├── dashboard/            # Métricas do painel administrativo
│   ├── speakers/             # Gestão de palestrantes
│   ├── sponsors/             # Gestão de patrocinadores
│   ├── staff/                # Monitores e equipe do evento
│   ├── storage/              # Módulo genérico de integração com MinIO. Centraliza lógica de upload, delete e geração de URLs assinadas para: Banners de eventos, Logos e Capas de Organizadores (Tenants), Comprovantes de submissão, Material de atividades
│   ├── mail/                 # Envio de e-mails (BullMQ + Nodemailer)
│   ├── tenants/              # Dados de organização
│   ├── forms/                # Formulários dinâmicos
│   └── prisma/               # PrismaModule (injeção global)
├── test/                     # Testes E2E (.e2e-spec.ts)
├── docker-compose.yml        # (na raiz do projeto)
└── package.json
```

### Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Layout raiz (metadata, providers)
│   │   ├── globals.css             # Estilos globais (Tailwind)
│   │   ├── favicon.ico
│   │   ├── (public)/               # Rotas públicas (sem auth)
│   │   │   ├── page.tsx            # Home / Listing de eventos
│   │   │   ├── layout.tsx          # Layout público (Navbar + Footer)
│   │   │   ├── auth/
│   │   │   │   ├── login/          # Tela de login
│   │   │   │   └── register/       # Tela de registro
│   │   │   ├── events/
│   │   │   │   ├── page.tsx        # Listagem de eventos públicos
│   │   │   │   └── [slug]/         # Detalhe do evento público
│   │   │   ├── checkout/           # Fluxo de inscrição
│   │   │   ├── tickets/            # Meus ingressos
│   │   │   ├── profile/            # Perfil do participante
│   │   │   └── u/                  # Perfil público (/u/username)
│   │   ├── dashboard/              # Painel administrativo (auth required)
│   │   │   ├── layout.tsx          # Layout com Sidebar
│   │   │   ├── page.tsx            # Dashboard principal
│   │   │   ├── events/             # Gestão de eventos
│   │   │   │   ├── page.tsx        # Lista de eventos do tenant
│   │   │   │   ├── new/            # Criar novo evento
│   │   │   │   └── [id]/           # Detalhe do evento
│   │   │   │       ├── page.tsx    # Painel do evento (29KB)
│   │   │   │       ├── activities/ # Gestão de atividades
│   │   │   │       ├── analytics/  # Relatórios do evento
│   │   │   │       ├── certificates/ # Gestão de certificados
│   │   │   │       ├── forms/      # Formulários do evento
│   │   │   │       ├── gamification/ # Painel de gamificação
│   │   │   │       ├── operations/ # Operações (checkin, sorteio)
│   │   │   │       ├── sponsors/   # Patrocinadores
│   │   │   │       └── submissions/ # Trabalhos científicos
│   │   │   ├── categories/         # Tipos de atividade / Papéis
│   │   │   ├── finance/            # Módulo financeiro
│   │   │   ├── force-password-change/ # Troca forçada de senha
│   │   │   ├── participants/       # Gestão de participantes
│   │   │   ├── profile/            # Perfil do organizador
│   │   │   ├── reviews/            # Painel de revisão
│   │   │   ├── settings/           # Configurações
│   │   │   └── speakers/           # Gestão de palestrantes
│   │   ├── monitor/                # Área do monitor (check-in)
│   │   ├── certificates/           # Validação pública de certificados
│   │   ├── raffle-display/         # Display de sorteio (telão)
│   │   └── speaker/                # Portal do palestrante
│   ├── components/
│   │   ├── common/                 # Navbar, Footer, ConfirmationModal
│   │   ├── dashboard/              # Sidebar, Formulários, Modals
│   │   │   └── checkin/            # Scanner QR, componentes de check-in
│   │   ├── events/                 # EventCard, ScheduleGrid, SponsorShowcase
│   │   ├── activities/             # ActivityEnrollmentList
│   │   ├── certificates/           # CertificatesList
│   │   ├── submissions/            # SubmissionsList
│   │   ├── profile/                # AvatarWithBorder, Badge3D, BadgesShowcase
│   │   └── providers/              # Providers globais
│   ├── context/
│   │   └── AuthContext.tsx          # Contexto de autenticação (React Context)
│   ├── services/                   # 18 service files (chamadas à API)
│   ├── types/                      # TypeScript types (auth, event, certificate)
│   ├── lib/
│   │   └── api.ts                   # Cliente API (fetch + refresh automático)
│   └── utils/                       # Utilitários
├── e2e/                            # Testes E2E com Playwright
├── public/                         # Assets estáticos
└── package.json
```

---

## Padrões Arquiteturais

### Backend

| Padrão | Aplicação |
|--------|-----------|
| **Modular (NestJS)** | Cada funcionalidade é um módulo independente |
| **Repository (Prisma)** | Prisma ORM como camada de acesso a dados |
| **Strategy Pattern** | Checkout: `FreeTicketStrategy`, extensível para `PaidTicketStrategy` |
| **Queue/Job Pattern** | BullMQ para e-mails (`mail-queue`) e atividades (`activities`) |
| **Guard Pattern** | `JwtAuthGuard`, `RolesGuard`, `MonitorGuard` |
| **Filter Pattern** | Exception filter para erros do Prisma |
| **DTO Validation** | `class-validator` + `class-transformer` |

### Frontend

| Padrão | Aplicação |
|--------|-----------|
| **App Router (Next.js)** | File-based routing com layouts aninhados |
| **Context API** | AuthContext para estado de autenticação global |
| **Service Layer** | 18 services encapsulam chamadas à API |
| **API Client Singleton** | Classe `ApiClient` com refresh automático de tokens |
| **Server/Client Components** | `"use client"` para interatividade, SSR para SEO |

---

## Comunicação entre Camadas

```
[Frontend Service] → [API Client (lib/api.ts)] → [Backend Controller]
                                                        │
                                                  [Backend Service]
                                                        │
                                                  [Prisma Client]
                                                        │
                                                  [PostgreSQL]
```

- **Autenticação**: Bearer Token no header `Authorization`
- **Formato de dados**: JSON
- **Upload de arquivos**: `multipart/form-data`
- **CORS**: Configurado para `localhost:3001` e `localhost:3000`

---

## Infraestrutura (Docker Compose)

Os serviços de infraestrutura rodam via Docker Compose:

| Serviço | Container | Volumes |
|---------|-----------|---------|
| PostgreSQL 16 Alpine | `eventhub-postgres` | `postgres_data` + `init.sql` |
| Redis 7 Alpine | `eventhub-redis` | `redis_data` (append-only) |
| MinIO | `eventhub-minio` | `minio_data` |

Rede: `eventhub-network` (bridge)

---

## Documentação da API

A API é automaticamente documentada pelo **Swagger (OpenAPI)**:

- **URL**: `http://localhost:3000/api/docs`
- **Autenticação**: Suporte a Bearer Auth no Swagger UI
- **Exemplos**: DTOs com validações e exemplos
- **Uploads**: Suporte a `multipart/form-data` documentado
