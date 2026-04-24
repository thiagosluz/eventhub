# Como testar o sistema de XP/Gamificação

Este guia complementa [gamificacao.md](gamificacao.md) com um roteiro
prático para validar manualmente e automatizadamente o sistema de XP
sempre que mexermos em check-in, perfil, fórmula de nível ou nos
endpoints do painel de gamificação.

## Pré-requisitos

- Backend rodando (`docker compose up` ou `npm run start:dev` no
  [`backend/`](../backend)) com banco migrado e seed aplicado.
- Frontend rodando em `http://localhost:3001` (`npm run dev` no
  [`frontend/`](../frontend)).
- Usuário de testes com papel `PARTICIPANT` e pelo menos um evento
  publicado (o seed já cobre esse cenário).

## Ajuste rápido de XP/nível (dev)

Para forçar um nível e XP mínimo coerente na sua conta (sem `awardXp` nem
`XpGainLog`), use o script `simulate-xp` — sintaxe, limitações e
exemplos em [gamificacao.md](gamificacao.md) (seção **Simular XP e nível
em uma conta (dev)**).

### PR do Bloco 6 (padronização UI — perfil público)

Se o PR alterar [`(public)/profile/page.tsx`](../frontend/src/app/(public)/profile/page.tsx),
use o checklist copiável em [gamificacao.md](gamificacao.md) — seção
**Checklist para PR — Bloco 6** — para não remover `LevelProgressBar` nem
recalcular progresso fora de `levelProgress`.

## 1. Checklist manual

### 1.1. Check-in único concede XP

1. Logar como participante e acessar um evento publicado.
2. Efetuar check-in pelo monitor/telão (`/monitor/events/:id/checkin`).
3. Verificar que o toast mostra `+200 XP` (e confetes se houve level
   up) — componente [`xp-toast.tsx`](../frontend/src/utils/xp-toast.tsx).
4. Em `/profile`, confirmar que a barra de progresso avançou conforme
   `levelProgress` (tooltip mostra `X XP para o nível N+1`).

### 1.2. Check-in duplicado (idempotência)

1. Repetir o check-in acima no mesmo evento sem desfazer o anterior.
2. A resposta deve retornar `xpGained: 0` e `alreadyCheckedIn: true`.
3. Em `/users/me/xp-history` o log do check-in continua com apenas 1
   entrada (verificar via API ou Prisma Studio).

### 1.3. Check-in de atividade

1. Inscrever o participante em uma atividade e fazer check-in dela.
2. Esperado: `+50 XP`, `reason = ACTIVITY_CHECKIN`.

### 1.4. Perfil completo concede XP 1x

1. Preencher todos os campos obrigatórios (nome, email, bio, username,
   avatar, interesses).
2. Salvar o perfil: toast mostra `+150 XP` e, se for o caso, level up.
3. Editar qualquer campo e salvar novamente: **não** deve conceder XP
   adicional (entrada única em `XpGainLog` com
   `uniqueKey = PROFILE_COMPLETED`).

### 1.5. Teto diário de 1.500 XP

1. Com o usuário acima do teto (acionar múltiplos eventos de teste ou
   forçar via script), tentar mais um check-in no mesmo dia.
2. Esperado: `xpGained = 0`, `reason = DAILY_LIMIT_REACHED`.

### 1.6. Alerta de spike

Qualquer ganho `> 500 XP` em um único evento gera registro em
`GamificationAlert`. Pelo painel do organizador
(`/dashboard/events/:id/gamification`), alertas pendentes devem
aparecer e poder ser resolvidos.

### 1.7. Nível exibido em todas as superfícies

- `/profile`: nome + avatar com borda correspondente ao tier de nível.
- `/u/:username` (perfil público): mesmo nível.
- `/dashboard/events/:id/gamification`: ranking respeita `user.xp`.

## 2. Inspeção direta no banco

Com Prisma Studio (`npx prisma studio` em [`backend/`](../backend)):

- `User`: campos `xp` e `level`.
- `XpGainLog`: um registro por ganho (`amount`, `reason`, `uniqueKey`,
  `eventId`, `createdAt`). Use o índice `userId + createdAt` para
  auditoria.
- `GamificationAlert`: registros de spike ou abuso.

Para consultas rápidas no Postgres:

```sql
SELECT "amount", "reason", "eventId", "createdAt"
FROM "XpGainLog"
WHERE "userId" = '<user>'
ORDER BY "createdAt" DESC;

SELECT date_trunc('day', "createdAt") AS day, SUM("amount") AS total
FROM "XpGainLog"
WHERE "userId" = '<user>'
GROUP BY day
ORDER BY day DESC;
```

## 3. Mapa de testes automatizados

### Backend — unit

| Arquivo                                                                                            | Cobre                                                                        |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [`backend/src/gamification/gamification.service.spec.ts`](../backend/src/gamification/gamification.service.spec.ts) | `calculateLevel`, `awardXp` (idempotência, teto, spike), stats e ranking     |
| [`backend/src/checkin/checkin.service.spec.ts`](../backend/src/checkin/checkin.service.spec.ts)    | Interação do check-in com `awardXp` (mockado)                                |
| [`backend/src/users/users.service.spec.ts`](../backend/src/users/users.service.spec.ts)            | Concessão de +150 no perfil completo e histórico paginado de XP              |
| [`backend/src/analytics/analytics.controller.spec.ts`](../backend/src/analytics/analytics.controller.spec.ts) | Endpoints `/analytics/.../gamification/*` e revogação de badges              |

Rodar apenas os relacionados:

```bash
cd backend
npm test -- gamification
npm test -- users.service
```

### Backend — e2e

| Arquivo                                                                                                   | Cobre                                                            |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [`backend/test/gamification-shielding.e2e-spec.ts`](../backend/test/gamification-shielding.e2e-spec.ts)   | Concorrência + `uniqueKey` + teto diário sob carga (crítico)     |
| [`backend/test/checkin.e2e-spec.ts`](../backend/test/checkin.e2e-spec.ts)                                 | Fluxo real de check-in (mocka `GamificationService`)             |
| [`backend/test/users.e2e-spec.ts`](../backend/test/users.e2e-spec.ts)                                     | Fluxo real de `/users/me` e perfil                               |

Rodar:

```bash
cd backend
npm run test:e2e -- gamification-shielding
npm run test:e2e
```

### Frontend — unit

| Arquivo                                                                                                                | Cobre                                                                 |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [`frontend/src/lib/gamification/__tests__/level.test.ts`](../frontend/src/lib/gamification/__tests__/level.test.ts)    | `calculateLevel`, `xpForLevel`, `levelProgress` em pontos-chave       |
| [`frontend/src/utils/__tests__/xp-toast.test.tsx`](../frontend/src/utils/__tests__/xp-toast.test.tsx)                  | Toast de XP/level up                                                  |
| [`frontend/src/app/dashboard/events/[id]/gamification/__tests__/GamificationDashboardPage.test.tsx`](../frontend/src/app/dashboard/events/[id]/gamification/__tests__/GamificationDashboardPage.test.tsx) | Painel do organizador                                                 |
| [`frontend/src/services/__tests__/analytics.service.spec.ts`](../frontend/src/services/__tests__/analytics.service.spec.ts) | Cliente HTTP dos endpoints de gamificação                             |

Rodar:

```bash
cd frontend
npm test -- level
npm test -- gamification
npm test -- xp-toast
```

### Frontend — e2e (Playwright)

| Arquivo                                                                                   | Cobre                                                    |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [`frontend/e2e/gamification.spec.ts`](../frontend/e2e/gamification.spec.ts)               | Perfil, nível exibido, resgate de badge                  |
| [`frontend/e2e/monitor.spec.ts`](../frontend/e2e/monitor.spec.ts)                         | Fluxo de check-in manual (mocka gamificação)             |

Rodar:

```bash
cd frontend
npm run test:e2e -- gamification
npm run test:e2e -- monitor
```

## 4. Ao mexer na fórmula ou em gatilhos

Checklist obrigatório antes do merge:

1. Atualizou `GamificationService.calculateLevel`?
   - Atualize [`frontend/src/lib/gamification/level.ts`](../frontend/src/lib/gamification/level.ts).
   - Atualize o cabeçalho de [`backend/src/scripts/simulate-xp.ts`](../backend/src/scripts/simulate-xp.ts).
   - Regere a tabela de thresholds em [gamificacao.md](gamificacao.md).
2. Mudou um valor de XP (+200/+50/+150 etc.)?
   - Reflita em [gamificacao.md](gamificacao.md) seção 1.
   - Reveja os testes listados acima que asseguram esse valor.
3. Adicionou um novo gatilho de XP?
   - Chame `GamificationService.awardXp` (nunca `prisma.user.update` no
     campo `xp`).
   - Passe um `uniqueKey` determinístico (ex.: `REVIEW_{reviewId}`) e,
     quando fizer sentido, `eventId`.
   - Adicione um unit de service cobrindo o novo caminho.
4. Rodou o suite mínimo abaixo? (é o smoke-test do sistema de XP)

```bash
# Backend
cd backend
npm test -- gamification
npm test -- users.service
npm run test:e2e -- gamification-shielding

# Frontend
cd ../frontend
npm test -- level
npm test -- xp-toast
npm test -- gamification
```
