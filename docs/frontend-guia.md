# Frontend — Guia Técnico

Este documento descreve a arquitetura, organização e padrões do frontend do EventHub.

---

## Stack Tecnológico

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Next.js** | 16.2.1 | Framework React com App Router e SSR |
| **React** | 19.2.4 | Biblioteca de UI |
| **TypeScript** | 5.x | Tipagem estática |
| **Tailwind CSS** | 4.x | Estilização utility-first |
| **PostCSS** | - | Processamento CSS |
| **Axios** | 1.14 | *(importado mas não utilizado — ver lib/api.ts)* |
| **Framer Motion** | 12.38 | Animações e transições |
| **Recharts** | 3.8 | Gráficos e visualizações |
| **React Hot Toast** | 2.6 | Notificações toast |
| **html5-qrcode** | 2.3 | Scanner de QR Code |
| **html-to-image** | 1.11 | Captura de elementos HTML como imagem |
| **canvas-confetti** | 1.9 | Animação de confetes |
| **js-cookie** | 3.0 | Manipulação de cookies |
| **Heroicons** | 2.2 | Ícones |

### Dev Dependencies

| Tecnologia | Propósito |
|------------|-----------|
| **Vitest** | Testes unitários |
| **Testing Library** | Testes de componentes React |
| **Playwright** | Testes E2E |
| **ESLint** + **eslint-config-next** | Linting |

---

## Estrutura de Rotas (App Router)

O Next.js 16 utiliza o **App Router** (file-based routing com layouts aninhados).

### Rotas Públicas `(public)/`

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/` | `(public)/page.tsx` | Página inicial com listagem de eventos |
| `/auth/login` | `(public)/auth/login/page.tsx` | Tela de login |
| `/auth/register` | `(public)/auth/register/page.tsx` | Tela de registro |
| `/events` | `(public)/events/page.tsx` | Listagem pública de eventos |
| `/events/[slug]` | `(public)/events/[slug]/page.tsx` | Detalhe do evento público |
| `/organizers` | `(public)/organizers/page.tsx` | Diretório de organizadores ativos |
| `/organizers/[slug]` | `(public)/organizers/[slug]/page.tsx` | Brand Hub — Vitrine do organizador |
| `/checkout` | `(public)/checkout/page.tsx` | Fluxo de inscrição |
| `/tickets` | `(public)/tickets/page.tsx` | Meus ingressos |
| `/profile` | `(public)/profile/page.tsx` | Perfil do participante |
| `/u/[username]` | `(public)/u/[username]/page.tsx` | Perfil público |

**Layout público**: Navbar + conteúdo + Footer.

### Rotas do Dashboard `/dashboard/`

| Rota | Descrição |
|------|-----------|
| `/dashboard` | Painel principal com métricas |
| `/dashboard/events` | Lista de eventos do tenant |
| `/dashboard/events/new` | Criar novo evento |
| `/dashboard/events/[id]` | Painel do evento (29KB — maior arquivo do projeto) |
| `/dashboard/events/[id]/activities` | Gestão de atividades |
| `/dashboard/events/[id]/analytics` | Relatórios e gráficos |
| `/dashboard/events/[id]/certificates` | Templates e emissão |
| `/dashboard/events/[id]/forms` | Formulários do evento |
| `/dashboard/events/[id]/gamification` | Painel de gamificação |
| `/dashboard/events/[id]/operations` | Check-in e sorteios |
| `/dashboard/events/[id]/sponsors` | Patrocinadores |
| `/dashboard/events/[id]/submissions` | Trabalhos científicos |
| `/dashboard/categories` | Tipos de atividade e papéis |
| `/dashboard/finance` | Módulo financeiro |
| `/dashboard/force-password-change` | Troca forçada de senha |
| `/dashboard/participants` | Gestão de participantes |
| `/dashboard/profile` | Perfil do organizador |
| `/dashboard/reviews` | Painel de revisão |
| `/dashboard/settings` | Configurações |
| `/dashboard/speakers` | Gestão de palestrantes |

**Layout do dashboard**: Sidebar + conteúdo principal.

### Rotas Especiais

| Rota | Descrição |
|------|-----------|
| `/monitor` | Área do monitor (check-in) |
| `/monitor/events/[id]` | Check-in em evento específico |
| `/certificates` | Validação pública de certificados |
| `/raffle-display` | Display de sorteio para telão |
| `/speaker` | Portal do palestrante |

---

## Componentes

### Componentes Comuns (`components/common/`)

| Componente | Descrição |
|------------|-----------|
| `Navbar.tsx` | Barra de navegação responsiva com menu mobile |
| `Footer.tsx` | Rodapé do site |
| `ConfirmationModal.tsx` | Modal genérico de confirmação |

### Componentes do Dashboard (`components/dashboard/`)

| Componente | Descrição |
|------------|-----------|
| `Sidebar.tsx` | Menu lateral do painel administrativo |
| `ActivityForm.tsx` | Formulário de criação/edição de atividades (16KB) |
| `SpeakerForm.tsx` | Formulário de palestrantes |
| `ParticipantsModal.tsx` | Modal de listagem de participantes |
| `ParticipantDetailDrawer.tsx` | Drawer lateral com ficha detalhada |
| `DeleteConfirmationModal.tsx` | Modal de exclusão segura |
| `SecureDeleteModal.tsx` | Modal com confirmação por digitação |
| `SeoPreview.tsx` | Pré-visualização de SEO |
| `SuccessModal.tsx` | Modal de sucesso com confetes |
| `checkin/` | Componentes de scanner QR e check-in |

### Componentes de Eventos (`components/events/`)

| Componente | Descrição |
|------------|-----------|
| `EventCard.tsx` | Card de evento na listagem |
| `ScheduleGrid.tsx` | Grade de programação (13KB) |
| `SpeakerCard.tsx` | Card de palestrante |
| `SpeakerDetailsModal.tsx` | Modal com detalhes do palestrante |
| `SpeakersSection.tsx` | Seção de palestrantes |
| `SponsorShowcase.tsx` | Vitrine de patrocinadores |
| `TicketWidget.tsx` | Widget de ingresso |
| `SocialShare.tsx` | Compartilhamento em redes sociais |

### Componentes de Perfil (`components/profile/`)

| Componente | Descrição |
|------------|-----------|
| `AvatarWithBorder.tsx` | Avatar com borda animada por nível |
| `Badge3D.tsx` | Badge 3D com efeito de rotação (9KB) |
| `BadgesShowcase.tsx` | Vitrine de conquistas (13KB) |

### Outros Componentes

| Pasta | Componente | Descrição |
|-------|------------|-----------|
| `activities/` | `ActivityEnrollmentList.tsx` | Lista de inscritos em atividade (11KB) |
| `certificates/` | `CertificatesList.tsx` | Lista de certificados |
| `submissions/` | `SubmissionsList.tsx` | Lista de trabalhos |
| `providers/` | Providers globais | Wrappers de contexto |

---

## Camada de Serviços

O frontend possui **18 service files** que encapsulam todas as chamadas à API:

| Service | Responsabilidade |
|---------|------------------|
| `auth.service.ts` | Login, registro, refresh |
| `events.service.ts` | CRUD de eventos |
| `activities.service.ts` | Gestão de atividades |
| `analytics.service.ts` | Relatórios e métricas |
| `badges.service.ts` | Conquistas |
| `certificates.service.ts` | Templates e emissão |
| `checkout.service.ts` | Inscrição em eventos |
| `dashboard.service.ts` | Métricas do painel |
| `forms.service.ts` | Formulários dinâmicos |
| `management.service.ts` | Gestão administrativa |
| `operations.service.ts` | Check-in e sorteios |
| `participants.service.ts` | Listagem de participantes |
| `speakers.service.ts` | Palestrantes |
| `sponsors.service.ts` | Patrocinadores |
| `staff.service.ts` | Monitores e equipe |
| `submissions.service.ts` | Trabalhos científicos (5KB) |
| `tenants.service.ts` | Organizações |
| `users.service.ts` | Perfil de usuários |

---

## Cliente API (`lib/api.ts`)

Classe singleton `ApiClient` que gerencia todas as requisições HTTP:

### Funcionalidades
- **GET**, **POST**, **PATCH**, **DELETE** com tipagem genérica.
- **Autenticação automática**: Injeta Bearer Token do `localStorage`.
- **Refresh automático (silent refresh)**: Intercepta 401 e tenta renovar token.
- **Queue de requisições**: Requisições concorrentes aguardam o refresh em fila.
- **Logout automático**: Se o refresh falhar, limpa tokens e redireciona.
- **FormData support**: Detecta `FormData` e omite `Content-Type`.
- **SSR support**: Tenta ler tokens de cookies no server-side via `next/headers`.
- **Query params**: Suporte a `params` opcional para query strings.

---

## Contexto de Autenticação (`context/AuthContext.tsx`)

Provider React que gerencia o estado global de autenticação:

### Estado
- `user: User | null` — Usuário logado.
- `isAuthenticated: boolean` — Derivado de `!!user`.
- `isLoading: boolean` — True durante hidratação.

### Métodos
- `login(authData)` — Salva tokens/user no localStorage e cookies, redireciona por role.
- `logout()` — Limpa tudo e redireciona para `/`.
- `updateUser(data)` — Atualiza parcialmente o user no estado e localStorage.

### Comportamentos
- Sincroniza localStorage com cookies para SSR.
- Detecta `mustChangePassword` e redireciona para `/dashboard/force-password-change`.
- Redirecionamento pós-login varia por role: ORGANIZER/REVIEWER → `/dashboard`, outros → `/`.

---

## Tipagem TypeScript (`types/`)

| Arquivo | Types |
|---------|-------|
| `auth.ts` | `User`, `AuthResponse` |
| `event.ts` | `Event`, `Activity`, `Ticket`, `Speaker`, `Submission`, `Review`, `Form`, etc. (218 linhas) |
| `certificate.ts` | Tipos de certificado |

---

## Testes

### Unitários (Vitest)
- Configuração: `vitest.config.ts`
- Ambiente: jsdom
- Setup: `src/test-setup.ts`
- Libraries: Testing Library React + jest-dom

### E2E (Playwright)
- Configuração: `playwright.config.ts`
- Diretório: `e2e/`
- Relatórios: `playwright-report/`
- Resultados: `test-results/`

### Comandos

## Padrões de UX e Performance

### Busca Assíncrona com Debounce
Para módulos com alta densidade de dados (como a busca de participantes no check-in), o frontend utiliza o padrão **Debounce**:
- **Atraso**: 500ms antes de disparar a requisição.
- **Trava de Segurança**: Mínimo de 3 caracteres para iniciar a busca.
- **Estado**: Carregamento visual (loading states) e tratamento de listas vazias/não encontradas.

### Branding Dinâmico
O frontend injeta cores dinâmicas a partir do `themeConfig` do tenant:
- **Cores Primárias/Secundárias**: Aplicadas via CSS Variables ou classes dinâmicas.
- **Logos/Banners**: Renderizados a partir de URLs do MinIO com fallback para placeholders premium.
