# Módulos e Funcionalidades — EventHub

Este documento descreve em detalhes cada módulo funcional do sistema, explicando sua finalidade, regras de negócio e fluxos.

---

## Índice

1. [Autenticação](#1-autenticação)
2. [Eventos](#2-eventos)
3. [Atividades](#3-atividades)
4. [Checkout (Inscrição)](#4-checkout-inscrição)
5. [Check-in e QR Code](#5-check-in-e-qr-code)
6. [Sorteios (Raffles)](#6-sorteios-raffles)
7. [Certificados](#7-certificados)
8. [Trabalhos Científicos (Submissions)](#8-trabalhos-científicos-submissions)
9. [Gamificação](#9-gamificação)
10. [Badges (Conquistas)](#10-badges-conquistas)
11. [Palestrantes (Speakers)](#11-palestrantes-speakers)
12. [Patrocinadores (Sponsors)](#12-patrocinadores-sponsors)
13. [Formulários Dinâmicos](#13-formulários-dinâmicos)
14. [Dashboard e Analytics](#14-dashboard-e-analytics)
15. [Gestão de Equipe (Staff)](#15-gestão-de-equipe-staff)
16. [Gestão de Usuários](#16-gestão-de-usuários)
17. [Tenants (Multi-Tenancy)](#17-tenants-multi-tenancy)
22. [Super Administração e Auditoria](#22-super-administração-e-auditoria)
18. [Storage (MinIO)](#18-storage-minio)
19. [E-mail](#19-e-mail)
20. [Área do Monitor](#20-área-do-monitor)
21. [Perfil Público](#21-perfil-público)

---

## 1. Autenticação

### Fluxos
- **Registro de Organizador**: Cria um tenant (organização) + usuário ORGANIZER.
- **Registro de Participante**: Cria um tenant individual + usuário PARTICIPANT.
- **Login**: Valida credenciais com Argon2, retorna tokens JWT.
- **Refresh Token**: Renova automaticamente o access_token quando expira.
- **Recuperação de Senha**: Envia token por e-mail, válido por 1 hora.
- **Troca Forçada**: Quando `mustChangePassword = true`, redireciona para tela especial.

### Regras de Negócio
- E-mail é único globalmente.
- Access token expira em **15 minutos**.
- Refresh token expira em **7 dias**.
- Refresh token é armazenado no banco e invalidado no logout.
- O cliente (frontend) faz **silent refresh** automaticamente ao receber 401.

---

## 2. Eventos

### Funcionalidades
- CRUD completo de eventos (nome, slug, datas, descrição, local, status).
- Upload de **banner** e **logo** via MinIO.
- Configuração de **SEO** (título e descrição).
- Configuração de **tema visual** (JSON com cores).
- Status: `DRAFT` → `PUBLISHED` → `ARCHIVED`.
- Apenas eventos em **DRAFT** podem ser excluídos.

### Portal Público
- Listagem de todos os eventos publicados.
- Página de detalhes por slug com: atividades, palestrantes, formulário de inscrição, modalidades de submissão, regras, patrocinadores.

### Gestão de Participantes
- Listagem com filtros por evento, nome/e-mail e status.
- Ficha detalhada do participante com: dados, tickets, inscrições em atividades, respostas de formulários, certificados emitidos e histórico em outros eventos.
- Exportação de participantes em CSV.

---

## 3. Atividades

### Funcionalidades
- CRUD de atividades dentro de um evento.
- Campos: título, descrição, local, horário, capacidade, tipo, status.
- **Vinculação de palestrantes** com papéis.
- Inscrição em atividades (com ou sem confirmação).
- Upload de **materiais** (slides, PDFs, etc.).
- **Feedback** dos participantes (nota 1-5 + comentário).
- **Taxonomias Globais**: Tipo de atividade e Papel do palestrante são geridos ao nível da organização (Settings), permitindo reutilização.
- **Criação Rápida**: Modal integrado ao formulário de atividade permite criar novos tipos/papéis sem abandonar o fluxo de montagem da grade.

### Regras de Negócio
- Atividade pode exigir **inscrição prévia** (`requiresEnrollment`).
- Inscrição pode exigir **confirmação** dentro de prazo (`confirmationDays`).
- Vagas são controladas pelo campo `capacity`.
- Processamento assíncrono via **BullMQ** para tarefas pesadas.

---

## 4. Checkout (Inscrição)

### Fluxo
1. Usuário autenticado envia `POST /checkout` com `eventId` e respostas do formulário.
2. Sistema cria: `Registration` → `Ticket` (com QR Code token) → `FormResponses`.
3. Badges de **EARLY_BIRD** são verificados automaticamente.

### Regras de Negócio
- Um usuário **não pode** se inscrever duas vezes no mesmo evento.
- Formulário de registro é validado dinamicamente (campos obrigatórios).
- Implementado com **Strategy Pattern** (`FreeTicketStrategy`), preparado para `PaidTicketStrategy`.

---

## 5. Check-in e QR Code

### Fluxo
1. Participante mostra QR Code (token único do ticket).
2. Organizador/Monitor escaneia via scanner no frontend.
3. Sistema valida: ticket existe → status COMPLETED → não duplicado.
4. Cria registro de `Attendance`.
5. Dispara:
   - E-mail de confirmação de check-in.
   - Verificação de badges (`CHECKIN_STREAK`, `ACTIVITY_HOURS`).
   - **XP**: +200 XP para check-in geral, +50 XP para check-in em atividade.

| 5. | **Mecanismo de Busca Escalável** | Introduzida busca *server-side* com *debounce* de 500ms e trava de segurança (mín. 3 caracteres), permitindo gerir eventos com 10.000+ inscritos sem travamentos no navegador. |
| 6. | **Idempotência** | Check-in é idempotente: se já existir, retorna `alreadyCheckedIn: true`. |
| 7. | **Permissões** | Apenas **ORGANIZER** do tenant ou **Monitor** designado podem fazer check-in. |
| 8. | **Extensibilidade** | Check-in em atividade valida inscrição prévia (quando `requiresEnrollment`). |
| 9. | **Reversibilidade** | Check-in pode ser **desfeito** (`undoCheckin`). |

---

## 6. Sorteios (Raffles)

### Funcionalidades
- Sorteio aleatório de participantes de um evento ou atividade.
- Regras: `ONLY_CHECKED_IN` (padrão) ou `ALL_REGISTERED`.
- Opções: quantidade de ganhadores, excluir staff, ganhadores únicos, nome do prêmio.
- Histórico completo com: ganhador, data, atividade, status de recebimento.
- **Display para telão** (`raffle-display`): com controle de visibilidade.
- Marcar prêmio como recebido (dispara badge `RAFFLE_WINNER`).

---

## 7. Certificados

### Funcionalidades
- **Editor Premium**: Interface moderna com **live preview**, edição de placeholders e configurações de estilo.
- **Sugestões Contextuais**: Textos sugeridos automaticamente baseados na categoria (PARTICIPANTE, PALESTRANTE, MONITOR, REVISOR).
- **Linguagem Inclusiva**: Templates de texto preparados para gêneros masculino e feminino.
- **Área do Participante Modernizada**: Listagem com **badges de categoria** e filtros por papel para fácil identificação.
- **Emissão individual** ou **em lote** para participantes de um evento.
- Geração de **PDF** com PDFKit (tag `{{cpf}}` removida para maior privacidade).
- **Hash de validação** único por certificado.
- **Validação pública**: Qualquer pessoa pode validar um certificado pelo hash.
- **Download** do PDF pelo dono do certificado.

---

## 8. Trabalhos Científicos (Submissions)

### Fluxo Completo
1. **Configuração** (Organizador): Habilitar submissões, configurar datas, criar modalidades/áreas temáticas/regras.
2. **Envio** (Participante): Upload de arquivo + título + resumo + seleção de modalidade e área.
3. **Designação** (Automática): Revisores são assignados via fila BullMQ.
4. **Revisão** (Revisor): Nota, recomendação (7 níveis), comentários.
5. **Decisão** (Organizador): Alterar status (ACCEPTED/REJECTED).

### Gestão de Revisores
- Convite por **e-mail** (com token + expiração).
- Adição de revisor **existente** no sistema.
- Criação de usuário REVIEWER com **senha temporária** (mustChangePassword).
- Distribuição automática de trabalhos.

---

## 9. Gamificação

### Sistema de XP
- XP é concedido por ações específicas:
  - **Check-in no evento**: +200 XP
  - **Check-in em atividade**: +50 XP
  - Outros (extensível): perfil completo, etc.
- **Limite diário**: 1.500 XP por usuário/dia.
- **Prevenção de farming**: `uniqueKey` garante que cada ação dá XP uma única vez.
- **Transação atômica**: `SELECT ... FOR UPDATE` serializa atualizações de XP.
- **Detecção de spike**: Se um usuário ganhar ≥1.000 XP em 5 minutos, um `GamificationAlert` é criado.

### Sistema de Níveis
- Fórmula: `Level = floor((XP / 500)^0.6) + 1`
- Level-up é detectado automaticamente e retornado na resposta.

### Painel do Organizador
- Estatísticas: XP total distribuído, badges concedidas, alertas ativos, total de participantes.
- Ranking de XP por evento (top 100).
- Alertas de XP spike com resolução manual.

---

## 10. Badges (Conquistas)

### Tipos de Trigger

| Trigger | Descrição | Quando é verificado |
|---------|-----------|---------------------|
| `MANUAL` | Concedido manualmente pelo organizador | Via API ou scan |
| `RAFFLE_WINNER` | Automático ao receber prêmio de sorteio | Ao marcar prêmio como recebido |
| `EARLY_BIRD` | Primeiros N inscritos | No checkout |
| `CHECKIN_STREAK` | Check-ins consecutivos | No check-in |
| `ACTIVITY_HOURS` | Horas em atividades | No check-in |
| `EVENT_COUNT` | Participação em N eventos | No checkout |
| `PROFILE_COMPLETED` | Perfil 100% preenchido | Ao atualizar perfil |

### Modos de Entrega Manual

| Modo | Descrição |
|------|-----------|
| `GLOBAL_CODE` | Código único compartilhado (todos usam o mesmo) |
| `UNIQUE_CODES` | Lote de códigos únicos (cada um é usado uma vez) |
| `SCAN` | Atribuído via scan do organizador |

### Restrições
- Um usuário só pode ganhar a **mesma badge uma vez por evento** (`@@unique([userId, badgeId, eventId])`).

---

## 11. Palestrantes (Speakers)

### Funcionalidades
- CRUD por tenant (não por evento — compartilhados entre eventos).
- Campos: nome, e-mail, bio, avatar, LinkedIn, website.
- Vinculação com **User** do sistema (opcional): campo `userId`.
- Vinculação com **atividades** com papel (via `ActivitySpeaker` + `SpeakerRole`).

### Portal do Palestrante
- Acesso por usuários com role `SPEAKER` ou organizadores com `isSpeaker = true`.
- Visualiza atividades vinculadas e materiais.

---

## 12. Patrocinadores (Sponsors)

### Funcionalidades
- **Categorias** por evento: nome, cor, tamanho (SMALL/MEDIUM/LARGE), ordem.
- **Patrocinadores**: nome, logo (upload), website, ordem dentro da categoria.
- **Showcase público**: Componente `SponsorShowcase` no portal do evento.

---

## 13. Formulários Dinâmicos

### Funcionalidades
- Dois tipos: `REGISTRATION` (inscrição) e `SUBMISSION` (trabalhos).
- Campos dinâmicos com 8 tipos: TEXT, TEXTAREA, SELECT, MULTISELECT, CHECKBOX, DATE, NUMBER, EMAIL.
- Campos com: label, tipo, obrigatório, ordem, opções.
- **Sincronização de campos**: Endpoint de PATCH que adiciona/atualiza/remove campos atomicamente.

---

## 14. Dashboard e Analytics

### Dashboard (Painel Principal)
- Total de eventos, participantes, atividades e receita do tenant.
- Métricas por eventos mais recentes.

### Analytics (por Evento)
- Taxa de ocupação.
- Distribuição de tipos de ingressos.
- Status de inscrições.
- Gráfico de registros diários (janela de 14 dias).
- Listagem detalhada de participantes com filtros.

---

## 15. Gestão de Equipe (Staff)

### Monitores
- Organizador adiciona monitores (qualquer usuário do sistema) a um evento.
- Monitores ganham permissão de **check-in** e **undo-checkin** naquele evento.
- Constraint: um usuário pode ser monitor de um evento apenas uma vez.

---

## 16. Gestão de Usuários

### Funcionalidades do Organizador
- Listar usuários do tenant.
- Criar novo usuário manualmente (com senha temporária).
- Visualizar perfis.

### Funcionalidades do Usuário
- Editar perfil: nome, bio, avatar, username, interesses, tema do perfil.
- Alterar senha (com validação da senha atual).
- Habilitar/desabilitar perfil público.

---

## 17. Tenants (Multi-Tenancy)

### Modelo
- Cada organização é um `Tenant` com nome, slug e configurações de marca.
- Todos os dados são isolados por `tenantId` ao nível de serviço.
- O `tenantId` é extraído do token JWT do usuário autenticado.

### Funcionalidades de Configuração
- **Tabs de Navegação**: Layout centralizado com abas para:
  - **Geral**: Visão geral e cards de atalho.
  - **Identidade Visual**: Logos e Banners (integração nativa ao MinIO).
  - **Perfil Público**: Bio e redes sociais do organizador.
  - **Minha Equipe**: Gestão de time e permissões.
  - **Categorias e Papéis**: Gestão global de taxonomias de atividades e palestrantes.
- **Ecossistema de Organizadores**: Diretório global em `/organizers` que agrega todos os parceiros ativos na plataforma.
- **Brand Hubs**: Páginas de marca dedicadas (`/organizers/[slug]`) exibindo informações da organização, redes sociais e eventos ativos.
- **Personalização de Tema**: Configuração de cores primárias e secundárias que se propagam para todas as páginas do organizador.

---

---

## 22. Super Administração e Auditoria

### Funcionalidades
- **Gestão Global de Tenants**: Visualizar, ativar e desativar qualquer inquilino na plataforma.
- **Auditoria Global**: Fluxo centralizado de logs de segurança e mutações em todos os tenants.
- **Impersonate (Login Fantasma)**: Super Admin pode entrar na conta de qualquer usuário para suporte técnico, gerando um token JWT com a marca d'água `impersonatedBy`.
- **Acesso Cross-Tenant**: Por possuir um `tenantId` nulo, o Super Admin tem privilégios globais que ignoram os filtros de isolamento padrão.

### Auditoria Global
- Captura de: Usuário, IP, Recurso, Ação (CREATE/UPDATE/DELETE), Payload e Data/Hora.
- Interface dedicada em `/admin/audit` com filtros e visualização em tempo real.

---

## 18. Storage (MinIO)

### Funcionalidades
- Upload de arquivos para MinIO (S3-compatible).
- Criação automática de buckets.
- Políticas de acesso público para assets.
- Utilizado para: banners, logos, avatars, arquivos de submissão, certificados, materiais de atividades.

### Validação
- Testes de integração com Testcontainers (container MinIO real).

---

## 19. E-mail

### Funcionalidades
- Enfileiramento de e-mails via **BullMQ** (fila `mail-queue`).
- Processamento assíncrono pelo `MailProcessor`.
- Envio via **Nodemailer** (SMTP configurável).
- Retry automático com exponential backoff.

### Templates (inline HTML)
- Recuperação de senha.
- Confirmação de check-in.
- Convite de revisor.

---

## 20. Área do Monitor

### Funcionalidades
- Rota dedicada: `/monitor`.
- Layout isolado com autenticação.
- Seleção de evento autorizado.
- Scanner QR Code reutilizado com componente compartilhado.
- Operações de check-in e undo-checkin.
- Validação de permissão via `MonitorGuard`.

---

## 21. Perfil Público

### Funcionalidades
- Rota: `/u/:username`.
- Exibe: avatar, nome, bio, nível, XP, badges, tema visual.
- Componentes 3D de badge com animações.
- Showcase de conquistas.
- Ativado/desativado pelo usuário (`publicProfile: true/false`).
