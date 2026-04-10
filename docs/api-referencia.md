# Referência da API — EventHub

Este documento lista todos os endpoints da API REST do EventHub, agrupados por módulo.

> **Swagger UI**: A documentação interativa está disponível em `http://localhost:3000/api/docs`.

---

## Convenções

- **Base URL**: `http://localhost:3000`
- **Autenticação**: Bearer Token (JWT) no header `Authorization: Bearer <token>`
- **Formato**: JSON (`application/json`)
- **Uploads**: `multipart/form-data`
- **Erros**: `{ message: string, statusCode: number }`

---

## 🔐 Auth — Autenticação

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|:----:|
| `POST` | `/auth/register` | Registrar novo organizador (cria tenant) | ❌ |
| `POST` | `/auth/register/participant` | Registrar novo participante | ❌ |
| `POST` | `/auth/login` | Login (retorna access_token + refresh_token) | ❌ |
| `POST` | `/auth/refresh` | Renovar token usando refresh_token | ❌ |
| `POST` | `/auth/logout` | Invalidar refresh token | ✅ |
| `POST` | `/auth/forgot-password` | Enviar token de recuperação por e-mail | ❌ |
| `POST` | `/auth/reset-password` | Resetar senha com token | ❌ |
| `PATCH` | `/auth/force-change-password` | Alterar senha obrigatória | ✅ |

### Resposta do Login/Register
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "id": "cuid",
    "name": "string",
    "email": "string",
    "role": "ORGANIZER|REVIEWER|SPEAKER|PARTICIPANT",
    "tenantId": "cuid",
    "isSpeaker": false,
    "mustChangePassword": false
  }
}
```

---

## 📅 Events — Eventos

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|:----:|------|
| `POST` | `/events` | Criar evento | ✅ | ORGANIZER |
| `GET` | `/events` | Listar eventos do tenant | ✅ | ORGANIZER |
| `GET` | `/events/:id` | Detalhes do evento (com atividades) | ✅ | ORGANIZER |
| `PATCH` | `/events/:id` | Atualizar evento | ✅ | ORGANIZER |
| `DELETE` | `/events/:id` | Excluir evento (apenas DRAFT) | ✅ | ORGANIZER |
| `PATCH` | `/events/:id/banner` | Upload de banner | ✅ | ORGANIZER |
| `PATCH` | `/events/:id/logo` | Upload de logo | ✅ | ORGANIZER |
| `GET` | `/events/public` | Listar todos eventos publicados | ❌ | - |
| `GET` | `/events/public/:slug` | Detalhes público do evento por slug | ❌ | - |
| `GET` | `/events/my-tickets` | Listar meus ingressos | ✅ | Qualquer |

### Participantes

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|:----:|------|
| `GET` | `/events/participants` | Listar participantes (filtros) | ✅ | ORGANIZER |
| `GET` | `/events/participants/:id` | Detalhes do participante | ✅ | ORGANIZER |
| `GET` | `/events/participants/export` | Exportar CSV de participantes | ✅ | ORGANIZER |

---

## 🎯 Activities — Atividades

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|:----:|------|
| `POST` | `/activities/:eventId` | Criar atividade | ✅ | ORGANIZER |
| `GET` | `/activities/:eventId` | Listar atividades do evento | ✅ | ORGANIZER |
| `PATCH` | `/activities/:eventId/:activityId` | Atualizar atividade | ✅ | ORGANIZER |
| `DELETE` | `/activities/:eventId/:activityId` | Excluir atividade | ✅ | ORGANIZER |
| `POST` | `/activities/:eventId/:activityId/enroll` | Inscrever-se na atividade | ✅ | Qualquer |
| `DELETE` | `/activities/:eventId/:activityId/enroll` | Cancelar inscrição | ✅ | Qualquer |
| `GET` | `/activities/:eventId/:activityId/enrollments` | Listar inscritos | ✅ | ORGANIZER |
| `PATCH` | `/activities/:eventId/:activityId/enrollments/:enrollId` | Alterar status da inscrição | ✅ | ORGANIZER |
| `POST` | `/activities/:eventId/:activityId/speakers` | Vincular palestrante | ✅ | ORGANIZER |
| `DELETE` | `/activities/:eventId/:activityId/speakers/:speakerId` | Desvincular palestrante | ✅ | ORGANIZER |
| `POST` | `/activities/:eventId/:activityId/materials` | Upload de material | ✅ | ORGANIZER/SPEAKER |
| `GET` | `/activities/:eventId/:activityId/materials` | Listar materiais | ✅ | Qualquer |
| `DELETE` | `/activities/:eventId/:activityId/materials/:materialId` | Remover material | ✅ | ORGANIZER |
| `POST` | `/activities/:eventId/:activityId/feedback` | Enviar avaliação | ✅ | Qualquer |
| `GET` | `/activities/:eventId/:activityId/feedback` | Listar avaliações | ✅ | ORGANIZER |

---

## ✅ Check-in

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|:----:|------|
| `GET` | `/checkin/qrcode/:ticketId` | Gerar QR Code PNG | ✅ | Owner |
| `POST` | `/checkin` | Realizar check-in (QR token) | ✅ | ORGANIZER/Monitor |
| `DELETE` | `/checkin/:attendanceId` | Desfazer check-in | ✅ | ORGANIZER/Monitor |

### Sorteios (Raffles)

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|:----:|------|
| `POST` | `/checkin/raffle/draw` | Realizar sorteio | ✅ | ORGANIZER |
| `GET` | `/checkin/raffle/history/:eventId` | Histórico de sorteios | ✅ | ORGANIZER |
| `PATCH` | `/checkin/raffle/:historyId/display` | Mudar visibilidade no display | ✅ | ORGANIZER |
| `DELETE` | `/checkin/raffle/:historyId` | Excluir sorteio | ✅ | ORGANIZER |
| `PATCH` | `/checkin/raffle/:historyId/received` | Marcar prêmio como recebido | ✅ | ORGANIZER |

---

## 🛒 Checkout — Inscrição em Eventos

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|:----:|------|
| `POST` | `/checkout` | Realizar inscrição (gera ticket) | ✅ | Qualquer |

---

## 📜 Certificates — Certificados

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|:----:|------|
| `POST` | `/certificates/templates` | Criar template | ✅ | ORGANIZER |
| `GET` | `/certificates/templates/:eventId` | Listar templates do evento | ✅ | ORGANIZER |
| `PATCH` | `/certificates/templates/:templateId` | Atualizar template | ✅ | ORGANIZER |
| `DELETE` | `/certificates/templates/:templateId` | Excluir template | ✅ | ORGANIZER |
| `POST` | `/certificates/issue` | Emitir certificado para participante | ✅ | ORGANIZER |
| `POST` | `/certificates/issue/batch` | Emissão em lote | ✅ | ORGANIZER |
| `GET` | `/certificates/my` | Meus certificados | ✅ | Qualquer |
| `GET` | `/certificates/event/:eventId` | Certificados emitidos do evento | ✅ | ORGANIZER |
| `GET` | `/certificates/validate/:hash` | Validação pública | ❌ | - |
| `GET` | `/certificates/download/:certificateId` | Download PDF | ✅ | Owner |

---

## 📝 Submissions — Trabalhos Científicos

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|:----:|------|
| `POST` | `/submissions` | Enviar trabalho (com upload) | ✅ | Qualquer |
| `GET` | `/submissions/my` | Meus trabalhos | ✅ | Qualquer |
| `GET` | `/submissions/event/:eventId` | Trabalhos do evento | ✅ | ORGANIZER |
| `GET` | `/submissions/:id` | Detalhes do trabalho | ✅ | Owner/ORGANIZER |
| `PATCH` | `/submissions/:id/status` | Alterar status | ✅ | ORGANIZER |

### Configuração de Submissões

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|:----:|------|
| `GET` | `/submission-config/:eventId` | Obter config de submissão | ✅ | ORGANIZER |
| `PATCH` | `/submission-config/:eventId` | Atualizar config | ✅ | ORGANIZER |
| `POST` | `/submission-config/:eventId/modalities` | Criar modalidade | ✅ | ORGANIZER |
| `POST` | `/submission-config/:eventId/thematic-areas` | Criar área temática | ✅ | ORGANIZER |
| `POST` | `/submission-config/:eventId/rules` | Upload de regra (PDF) | ✅ | ORGANIZER |
| `DELETE` | `/submission-config/:eventId/modalities/:id` | Excluir modalidade | ✅ | ORGANIZER |
| `DELETE` | `/submission-config/:eventId/thematic-areas/:id` | Excluir área temática | ✅ | ORGANIZER |
| `DELETE` | `/submission-config/:eventId/rules/:id` | Excluir regra | ✅ | ORGANIZER |

### Gestão de Revisores

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|:----:|------|
| `GET` | `/reviewer-management/:eventId/reviewers` | Listar revisores | ✅ | ORGANIZER |
| `POST` | `/reviewer-management/:eventId/invite` | Convidar revisor por e-mail | ✅ | ORGANIZER |
| `POST` | `/reviewer-management/:eventId/add-existing` | Adicionar revisor existente | ✅ | ORGANIZER |
| `DELETE` | `/reviewer-management/:eventId/reviewers/:userId` | Remover revisor | ✅ | ORGANIZER |
| `POST` | `/reviewer-management/accept-invitation/:token` | Aceitar convite | ❌ | - |
| `GET` | `/reviewer-management/my-assignments` | Meus trabalhos para revisão | ✅ | REVIEWER |
| `POST` | `/reviewer-management/review/:submissionId` | Enviar revisão | ✅ | REVIEWER |

---

## 🏅 Badges — Conquistas

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|:----:|------|
| `POST` | `/badges` | Criar badge | ✅ | ORGANIZER |
| `GET` | `/badges/event/:eventId` | Listar badges do evento | ✅ | ORGANIZER |
| `PATCH` | `/badges/:badgeId` | Atualizar badge | ✅ | ORGANIZER |
| `DELETE` | `/badges/:badgeId` | Excluir badge | ✅ | ORGANIZER |
| `POST` | `/badges/:badgeId/award/:userId` | Conceder badge (manual) | ✅ | ORGANIZER |
| `POST` | `/badges/claim` | Resgatar badge por código | ✅ | Qualquer |
| `GET` | `/badges/my` | Minhas badges | ✅ | Qualquer |

---

## 🎮 Gamification — XP e Níveis

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|:----:|------|
| `GET` | `/gamification/event/:eventId/stats` | Estatísticas de gamificação | ✅ | ORGANIZER |
| `GET` | `/gamification/event/:eventId/ranking` | Ranking de XP do evento | ✅ | ORGANIZER |
| `GET` | `/gamification/event/:eventId/alerts` | Alertas de XP spike | ✅ | ORGANIZER |
| `PATCH` | `/gamification/alerts/:alertId/resolve` | Resolver alerta | ✅ | ORGANIZER |

---

## 📊 Analytics — Relatórios

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|:----:|------|
| `GET` | `/analytics/events/:eventId` | Relatório completo do evento | ✅ | ORGANIZER |
| `GET` | `/analytics/events/:eventId/participants` | Lista de participantes | ✅ | ORGANIZER |

---

## 📈 Dashboard — Painel

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|:----:|------|
| `GET` | `/dashboard/stats` | Métricas gerais do tenant | ✅ | ORGANIZER |

---

## 👤 Users — Usuários

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|:----:|------|
| `GET` | `/users/profile` | Obter perfil do usuário logado | ✅ | Qualquer |
| `PATCH` | `/users/profile` | Atualizar perfil | ✅ | Qualquer |
| `PATCH` | `/users/password` | Alterar senha | ✅ | Qualquer |
| `PATCH` | `/users/avatar` | Upload de avatar | ✅ | Qualquer |
| `GET` | `/users` | Listar usuários do tenant | ✅ | ORGANIZER |
| `POST` | `/users` | Criar usuário manualmente | ✅ | ORGANIZER |
| `GET` | `/users/check-username/:username` | Verificar disponibilidade | ✅ | Qualquer |
| `GET` | `/users/public/:username` | Perfil público | ❌ | - |

---

## 🏢 Tenants — Organizações

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|:----:|------|
| `GET` | `/tenants/public-data` | Dados públicos do tenant | ✅ | ORGANIZER |
| `GET` | `/tenants/profile` | Perfil do tenant | ✅ | ORGANIZER |
| `PATCH` | `/tenants/branding` | Atualizar marca (logo + tema) | ✅ | ORGANIZER | 
| `GET` | `/admin/tenants` | Listar todos os tenants | ✅ | SUPER_ADMIN |
| `PATCH` | `/admin/tenants/:id/status` | Ativar/Desativar tenant | ✅ | SUPER_ADMIN |
| `GET` | `/admin/audit-logs` | Logs de auditoria global | ✅ | SUPER_ADMIN |
| `PATCH` | `/admin/impersonate/:userId` | Login fantasma (gera novo JWT) | ✅ | SUPER_ADMIN |

---

## 🎤 Speakers — Palestrantes

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|:----:|------|
| `POST` | `/speakers` | Criar palestrante | ✅ | ORGANIZER |
| `GET` | `/speakers` | Listar palestrantes do tenant | ✅ | ORGANIZER |
| `PATCH` | `/speakers/:id` | Atualizar palestrante | ✅ | ORGANIZER |
| `DELETE` | `/speakers/:id` | Excluir palestrante | ✅ | ORGANIZER |
| `GET` | `/speakers/portal` | Portal do palestrante | ✅ | SPEAKER |
| `GET` | `/speakers/portal/:activityId/materials` | Materiais da atividade | ✅ | SPEAKER |

---

## 💰 Sponsors — Patrocinadores

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|:----:|------|
| `POST` | `/sponsors/categories` | Criar categoria | ✅ | ORGANIZER |
| `GET` | `/sponsors/categories/:eventId` | Listar categorias do evento | ✅ | ORGANIZER |
| `PATCH` | `/sponsors/categories/:id` | Atualizar categoria | ✅ | ORGANIZER |
| `DELETE` | `/sponsors/categories/:id` | Excluir categoria | ✅ | ORGANIZER |
| `POST` | `/sponsors` | Criar patrocinador (com logo upload) | ✅ | ORGANIZER |
| `PATCH` | `/sponsors/:id` | Atualizar patrocinador | ✅ | ORGANIZER |
| `DELETE` | `/sponsors/:id` | Excluir patrocinador | ✅ | ORGANIZER |
| `GET` | `/sponsors/public/:eventId` | Listagem pública | ❌ | - |

---

## 📋 Forms — Formulários Dinâmicos

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|:----:|------|
| `GET` | `/forms/:eventId` | Listar formulários do evento | ✅ | ORGANIZER |
| `GET` | `/forms/:formId/detail` | Detalhes do formulário | ✅ | ORGANIZER |
| `PATCH` | `/forms/:formId/fields` | Sincronizar campos | ✅ | ORGANIZER |

---

## 📋 Kanban — Gestão de Tarefas

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|:----:|------|
| `GET` | `/kanban/event/:eventId/boards` | Listar quadros do evento | ✅ | ORGANIZER |
| `GET` | `/kanban/board/:boardId` | Detalhes do quadro (colunas + tarefas) | ✅ | ORGANIZER |
| `POST` | `/kanban/board` | Criar quadro | ✅ | ORGANIZER |
| `POST` | `/kanban/column` | Criar coluna (suporta `color`) | ✅ | ORGANIZER |
| `PATCH` | `/kanban/column/:id` | Atualizar coluna (nome, ordem, `color`) | ✅ | ORGANIZER |
| `DELETE` | `/kanban/column/:id` | Excluir coluna | ✅ | ORGANIZER |
| `PATCH` | `/kanban/columns/reorder` | Reordenar colunas em lote | ✅ | ORGANIZER|
| `POST` | `/kanban/task` | Criar tarefa | ✅ | ORGANIZER |
| `PATCH` | `/kanban/task/:id` | Editar tarefa | ✅ | ORGANIZER |
| `PATCH` | `/kanban/task/:id/move` | Mover tarefa entre colunas | ✅ | ORGANIZER |
| `DELETE` | `/kanban/task/:id` | Excluir tarefa | ✅ | ORGANIZER |
| `POST` | `/kanban/task/:id/assign` | Atribuir tarefa a usuário | ✅ | ORGANIZER |
| `POST` | `/kanban/task/:id/comment` | Adicionar comentário | ✅ | Qualquer |
| `GET` | `/kanban/event/:eventId/workload` | Carga de trabalho da equipe | ✅ | ORGANIZER |

---

## 👷 Staff — Equipe

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|:----:|------|
| `GET` | `/staff/:eventId/monitors` | Listar monitores | ✅ | ORGANIZER |
| `POST` | `/staff/:eventId/monitors` | Adicionar monitor | ✅ | ORGANIZER |
| `DELETE` | `/staff/:eventId/monitors/:monitorId` | Remover monitor | ✅ | ORGANIZER |

---

## 📧 Mail — Sistema de E-mails

O módulo de e-mail é interno (não possui endpoints públicos). E-mails são enfileirados via BullMQ e processados assincronamente pelo `MailProcessor`.

### Tipos de E-mail Enviados

| Situação | Template |
|----------|----------|
| **Recuperação de senha** | Token de reset (válido por 1h) |
| **Check-in realizado** | Confirmação com data/hora |
| **Convite de revisor** | Link com token de aceitação |

---

## Variáveis de Ambiente

### Backend (`.env`)

| Variável | Exemplo | Descrição |
|----------|---------|-----------|
| `DATABASE_URL` | `postgresql://eventhub:eventhub@localhost:5432/eventhub` | Conexão PostgreSQL |
| `JWT_SECRET` | `dev-super-secret-change-me` | Chave secreta JWT |
| `REDIS_HOST` | `localhost` | Host do Redis |
| `REDIS_PORT` | `6379` | Porta do Redis |
| `SMTP_HOST` | `localhost` | Host SMTP |
| `SMTP_PORT` | `1025` | Porta SMTP |
| `SMTP_USER` | *(vazio)* | Usuário SMTP |
| `SMTP_PASS` | *(vazio)* | Senha SMTP |
| `MAIL_FROM` | `noreply@eventhub.local` | Remetente de e-mails |
| `CORS_ORIGIN` | `http://localhost:3001` | Origens permitidas (separadas por vírgula) |
| `PORT` | `3000` | Porta do servidor |

### Frontend

| Variável | Exemplo | Descrição |
|----------|---------|-----------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | URL da API backend |
