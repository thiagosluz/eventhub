# Gamificação (XP, Níveis e Badges)

Este documento é a fonte da verdade do sistema de progressão (XP/níveis)
do EventHub. Sempre que uma regra de XP mudar — valor, gatilho, defesa
anti-abuso, curva de nível — atualize este documento **junto** com o
código. O backend, o frontend, o script `simulate-xp.ts` e este guia
precisam permanecer sincronizados.

> Escopo: progressão individual de participantes. Badges e moedas (`coins`)
> são subsistemas irmãos e são referenciados aqui apenas onde tocam XP.

## 1. Como o XP é concedido

A única porta de entrada para crédito de XP é
[`GamificationService.awardXp`](../backend/src/gamification/gamification.service.ts).
Ela é chamada em dois fluxos e somente nesses dois:

| Fluxo                      | XP  | `reason`            | `uniqueKey`                       | `eventId` preenchido? |
| -------------------------- | --- | ------------------- | --------------------------------- | --------------------- |
| Check-in geral no evento   | 200 | `EVENT_CHECKIN`     | `EVENT_CHECKIN_{eventId}`         | sim                   |
| Check-in em atividade      | 50  | `ACTIVITY_CHECKIN`  | `ACTIVITY_CHECKIN_{activityId}`   | sim                   |
| Perfil completado (1x)     | 150 | `PROFILE_COMPLETED` | `PROFILE_COMPLETED`               | não (ganho global)    |

Origem no código:
- Check-in: [`backend/src/checkin/checkin.service.ts`](../backend/src/checkin/checkin.service.ts) linhas 158-169.
- Perfil completo: [`backend/src/users/users.service.ts`](../backend/src/users/users.service.ts) linhas 136-145.

Inscrições, pagamentos, submissões aceitas, reviews e badges **não**
concedem XP hoje. Qualquer novo gatilho deve chamar `awardXp` sempre via
injeção de `GamificationService`; nunca manipule `User.xp` diretamente.

## 2. Fórmula do nível

```
Level = floor((XP / 500) ^ 0.6) + 1
```

A inversa, usada em simulações e para calcular o XP necessário para um
nível alvo:

```
XP_min(Level) = ceil(500 * (Level - 1) ^ (1 / 0.6))
```

Implementações sincronizadas:
- Backend: [`GamificationService.calculateLevel`](../backend/src/gamification/gamification.service.ts) linhas 11-17.
- Script: [`backend/src/scripts/simulate-xp.ts`](../backend/src/scripts/simulate-xp.ts) linhas 16-18.
- Frontend: [`frontend/src/lib/gamification/level.ts`](../frontend/src/lib/gamification/level.ts) com `calculateLevel`, `xpForLevel` e `levelProgress`.

### Tabela de thresholds (XP mínimo para atingir cada nível)

| Nível | XP     | Nível | XP      |
| ----- | ------ | ----- | ------- |
| 1     | 0      | 9     | 16.001  |
| 2     | 500    | 10    | 19.471  |
| 3     | 1.588  | 12    | 27.204  |
| 4     | 3.121  | 15    | 40.662  |
| 5     | 5.040  | 20    | 67.644  |
| 6     | 7.311  | 25    | 99.845  |
| 7     | 9.906  | 30    | 136.868 |
| 8     | 12.808 |       |         |

#### Simular XP e nível em uma conta (dev)

O script [`backend/src/scripts/simulate-xp.ts`](../backend/src/scripts/simulate-xp.ts)
**não** chama `awardXp`: ele faz `upsert` do usuário e grava `xp` e
`level` **direto no banco** com a inversa da fórmula, para testar
rapidamente a UI (perfil, barra de progresso, tier do avatar) sem
passar por check-in ou teto diário. **Não cria** linhas em
`XpGainLog` (o histórico `GET /users/me/xp-history` continua vazio
para esse ajuste).

Sintaxe:

```bash
cd backend
# Usa padrão: email participante@eventhub.com.br, nível alvo 50
npx ts-node src/scripts/simulate-xp.ts

# Sua própria conta: informe o e-mail e o nível desejado
npx ts-node src/scripts/simulate-xp.ts "seu@email.com" 12
```

- **1.º argumento (opcional):** e-mail do usuário. Se não existir, o
  script cria um participante de exemplo nesse e-mail; se existir, só
  atualiza `xp` e `level`.
- **2.º argumento (opcional):** nível alvo (inteiro, default 50). O
  script calcula o `xp` mínimo para esse nível e grava o par
  `(xp, level)`.
- **Banco:** `DATABASE_URL` (default local:
  `postgresql://eventhub:eventhub@localhost:5432/eventhub`).

Exemplo: colocar a conta `maria@exemplo.com` exatamente no **nível 5**:

```bash
npx ts-node src/scripts/simulate-xp.ts "maria@exemplo.com" 5
```

Depois, faça login com esse e-mail e abra o perfil ou `/u/{username}`.

#### Imprimir thresholds no terminal (opcional)

Não use `simulate-xp` para isso; é só um for em Node:

```bash
node -e "const e=0.6,b=500; for(let l=1;l<=30;l++) console.log(l, l<2?0:Math.ceil(b*Math.pow(l-1,1/e)))"
```

### Progresso real dentro do nível (frontend)

O perfil usa `levelProgress(xp)` do util compartilhado, que retorna
`{ level, currentLevelXp, nextLevelXp, xpIntoLevel, xpToNext, progressPercent }`.
`progressPercent` está sempre em `[0, 100]` e zera imediatamente após um
level up. **Não** use `xp % 1000` ou heurísticas visuais em UIs novas.

## 3. Defesas anti-abuso

`awardXp` é transacional e aplica as seguintes garantias em ordem:

1. `SELECT ... FOR UPDATE` na linha do usuário para serializar chamadas
   concorrentes (mesmo usuário).
2. **Idempotência por `uniqueKey`**: se já existe `XpGainLog` com o
   mesmo `(userId, uniqueKey)`, retorna `{ xpGained: 0, reason: "ALREADY_AWARDED" }`.
3. **Teto diário de 1.500 XP** (`DAILY_XP_LIMIT`). Se o usuário já ganhou
   `N` XP no dia, a próxima concessão credita no máximo `1500 - N`. Uma
   vez no teto, concessões seguintes no mesmo dia são bloqueadas.
4. **Alerta de spike**: qualquer ganho pontual `> 500` em um evento (com
   `eventId` setado) registra `GamificationAlert` do tipo `XP_SPIKE`.
5. Atualiza `user.xp`, recalcula `user.level` e retorna
   `{ xpGained, isLevelUp }` para o caller emitir toast/confetes.

Auditoria: cada concessão gera um registro imutável em `XpGainLog`
(ver [banco-de-dados.md](banco-de-dados.md)). A restrição
`@@unique([userId, uniqueKey])` é a rede de segurança contra corrida
mesmo que `uniqueKey` seja reaplicado em paralelo.

## 4. API

Todas as rotas administrativas de gamificação ficam sob o módulo
Analytics (ver [`backend/src/analytics/analytics.controller.ts`](../backend/src/analytics/analytics.controller.ts)):

| Método | Rota                                                      | Quem pode | Descrição                              |
| ------ | --------------------------------------------------------- | --------- | -------------------------------------- |
| GET    | `/analytics/events/:id/gamification/stats`                | ORGANIZER | KPIs agregados do evento               |
| GET    | `/analytics/events/:id/gamification/ranking`              | ORGANIZER | Ranking por evento (via `XpGainLog`)   |
| GET    | `/analytics/events/:id/gamification/alerts`               | ORGANIZER | Lista de `GamificationAlert` abertos   |
| PATCH  | `/analytics/gamification/alerts/:id/resolve`              | ORGANIZER | Resolve um alerta                      |
| GET    | `/analytics/events/:id/gamification/badges-history`       | ORGANIZER | Histórico de badges concedidos         |
| DELETE | `/analytics/gamification/badges/:userBadgeId/revoke`      | ORGANIZER | Revoga um badge concedido              |

Endpoints do próprio usuário:

| Método | Rota                         | Descrição                                                                          |
| ------ | ---------------------------- | ---------------------------------------------------------------------------------- |
| GET    | `/users/me`                  | Inclui `xp` e `level` do usuário logado                                            |
| PATCH  | `/users/me`                  | Pode retornar `xpGained` e `isLevelUp` quando o perfil fica completo pela 1ª vez   |
| GET    | `/users/p/:username`         | Perfil público, com `xp` e `level`                                                 |
| GET    | `/users/me/xp-history`       | Histórico paginado dos ganhos de XP do usuário (query `page`, `limit`, default 20) |

A resposta de `/users/me/xp-history` tem o formato:

```json
{
  "data": [
    {
      "id": "clv_...",
      "amount": 200,
      "reason": "EVENT_CHECKIN",
      "createdAt": "2025-01-10T12:34:56.000Z",
      "eventId": "ev-1",
      "eventName": "Conferência Tech 2025"
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20
}
```

`eventName` vem como `null` em ganhos globais (ex.: `PROFILE_COMPLETED`).

## 5. Fluxo ponta-a-ponta

```mermaid
flowchart LR
  UI["UI de check-in"] --> API["POST /checkin"]
  API --> Award["GamificationService.awardXp"]
  Award -->|"FOR UPDATE + uniqueKey + limite diário"| Log[("XpGainLog")]
  Award -->|"recalcula level"| User[("User.xp / User.level")]
  Award -->|"ganho &gt; 500"| Alert[("GamificationAlert")]
  API --> Resp["{ xpGained, isLevelUp }"]
  Resp --> Toast["xp-toast (confete no level up)"]
  Resp --> Profile["Perfil: levelProgress(xp)"]
```

## 6. Consumo no frontend

- Painel do organizador: [`frontend/src/app/dashboard/events/[id]/gamification/page.tsx`](../frontend/src/app/dashboard/events/[id]/gamification/page.tsx) (stats, ranking, alertas, histórico de badges).
- Cliente HTTP: [`frontend/src/services/analytics.service.ts`](../frontend/src/services/analytics.service.ts).
- Toasts de ganho e level up: [`frontend/src/utils/xp-toast.tsx`](../frontend/src/utils/xp-toast.tsx).
- Avatar com borda por tier (a cada 10 níveis): [`frontend/src/components/profile/AvatarWithBorder.tsx`](../frontend/src/components/profile/AvatarWithBorder.tsx).
- Perfil do usuário (barra de progresso real): [`frontend/src/app/(public)/profile/page.tsx`](../frontend/src/app/(public)/profile/page.tsx).
- Histórico de XP (service pronto, UI pendente para o Bloco 6): [`frontend/src/services/users.service.ts`](../frontend/src/services/users.service.ts) → `getMyXpHistory`.

## 7. Observações de evolução

- **Sem push real-time**: level up chega via resposta HTTP + toast. Se
  no futuro quisermos telão ao vivo, adicione um Gateway dedicado em
  vez de propagar por ganhos via `XpGainLog` polling.
- **Badges não concedem XP** hoje. Se isso mudar, use `awardXp` com um
  `uniqueKey` do tipo `BADGE_{badgeId}` para manter idempotência.
- **Dessincronia de fórmula**: qualquer alteração de `LEVEL_EXPONENT` ou
  `LEVEL_BASE` exige alterar **simultaneamente** backend, frontend e este
  documento; rode `npx ts-node backend/src/scripts/simulate-xp.ts` para
  validar os novos thresholds.

## 8. Checklist para PR — Bloco 6 (padronização UI do perfil público)

O plano de padronização de UI (`padronizacao-ui-eventhub`) prevê no **Bloco 6**
refatorar visualmente [`(public)/profile/page.tsx`](../frontend/src/app/(public)/profile/page.tsx)
(tokens, `premium-card`, remoção de gradientes fixos). Isso **não** muda
regras de XP no backend, mas um PR mal feito pode quebrar a experiência
premium (barra e nível). **Cole o bloco abaixo na descrição do PR** quando
o escopo incluir essa página.

```markdown
### Gamificação (perfil público) — obrigatório

- [ ] **Não remover** o componente [`LevelProgressBar`](../frontend/src/components/profile/LevelProgressBar.tsx) da área de nível/XP do perfil (ou manter um equivalente que delegue 100% para `levelProgress` em [`level.ts`](../frontend/src/lib/gamification/level.ts)).
- [ ] **Não recalcular** percentual de progresso, “XP até o próximo nível” ou nível exibido **fora** de `levelProgress` / `calculateLevel` — proibido heurísticas tipo `xp % 1000` ou fórmulas duplicadas na página.
- [ ] Continuar usando **`profile.xp`** e **`profile.level`** retornados por `GET /users/me` como fonte da verdade do total; timeline de `getMyXpHistory` (quando existir) é **complementar**, não substituto da barra.
- [ ] Manter [`AvatarWithBorder`](../frontend/src/components/profile/AvatarWithBorder.tsx) recebendo o nível coerente com o backend (prop `level` alinhada a `profile.level`).
- [ ] Testes verdes: `npm test -- LevelProgressBar level` (ou suíte completa do frontend).
```

Para testar (manual + automatizado), consulte
[gamificacao-testes.md](gamificacao-testes.md).
