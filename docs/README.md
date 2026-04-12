# 📚 EventHub — Documentação do Sistema

> Plataforma multi-tenant para gestão de eventos acadêmicos e corporativos.

---

## Índice de Documentos

| # | Documento | Descrição | Audiência |
|:-:|-----------|-----------|-----------|
| 1 | [Instalação](./instalacao.md) | Guia passo a passo para setup local | Devs (novatos) |
| 2 | [Arquitetura](./arquitetura.md) | Visão geral da arquitetura, stack, padrões e infraestrutura | Devs, Tech Leads |
| 3 | [Banco de Dados](./banco-de-dados.md) | Schema completo, entidades, relacionamentos, enums e constraints | Devs, DBAs |
| 4 | [API — Referência](./api-referencia.md) | Todos os endpoints REST organizados por módulo (~80+ endpoints) | Devs Frontend/Backend |
| 5 | [Módulos e Funcionalidades](./modulos-funcionalidades.md) | Descrição detalhada de cada módulo funcional e regras de negócio | Devs, POs, QAs |
| 6 | [Frontend — Guia Técnico](./frontend-guia.md) | Arquitetura do frontend: rotas, componentes, services, API client | Devs Frontend |
| 7 | [Testes](./testes.md) | Estratégia de testes: unitários, E2E, integração e performance | Devs, QAs |
| 8 | [Build e Lint](./build-e-lint.md) | Comandos de build, lint, Docker e fluxo de CI/CD | Devs, DevOps |

---

## Stack Tecnológico (Resumo)

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| **Frontend** | Next.js + React + Tailwind CSS | 16 / 19 / 4 |
| **Backend** | NestJS + Prisma + PostgreSQL | 11 / 7.6 / 16 |
| **Cache/Filas** | Redis + BullMQ | 7 |
| **Storage** | MinIO (S3-compatible) | latest |
| **Auth** | JWT + Argon2 + Passport.js | - |
| **Testes** | Jest + Vitest + Playwright + k6 | - |

---

## Módulos do Sistema

```
┌─────────────────────────────────────────────────────┐
│                    EVENTHUB                          │
├──────────────┬──────────────┬───────────────────────┤
│ 🔐 Auth      │ 📅 Events    │ 🎯 Activities        │
│ 🛒 Checkout  │ ✅ Checkin    │ 🎲 Raffles (Sorteios)│
│ 📜 Certific. │ 📝 Submiss.  │ 🎮 Gamification     │
│ 🏅 Badges    │ 📊 Analytics │ 📈 Dashboard         │
│ 🎤 Speakers  │ 💰 Sponsors  │ 📋 Forms             │
│ 👤 Users     │ 🏢 Tenants   │ 👷 Staff             │
│ 📧 Mail      │ 💾 Storage   │ 🖥️ Monitor           │
└──────────────┴──────────────┴───────────────────────┘
```

---

## Acesso Rápido

- **Swagger (API Docs)**: http://localhost:3000/api/docs
- **Frontend**: http://localhost:3001
- **MinIO Console**: http://localhost:9001
- **Prisma Studio**: `cd backend && npx prisma studio`

---

## Credenciais de Teste

| E-mail | Senha | Role |
|--------|:-----:|------|
| `admin@eventhub.com.br` | `123456` | Administrador (ORGANIZER) |
| `organizador@eventhub.com.br` | `123456` | Organizador (ORGANIZER) |
| `participante@eventhub.com.br` | `123456` | Participante (PARTICIPANT) |
| `revisor@eventhub.com.br` | `123456` | Revisor (REVIEWER) |

## Destaques da Versão (Abril 2026)

- **🚀 Ecossistema de Organizadores**: Diretório global e Brand Hubs personalizados para parceiros.
- **⚡ Check-in de Alta Escala**: Motor de busca server-side com suporte a 10.000+ participantes.
- **🎨 Branding Dinâmico**: Gestão de logos e banners via Object Storage (MinIO) com propagação de tema.

---

*Última atualização: Abril 2026*
