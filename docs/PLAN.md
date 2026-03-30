# PLAN.md - Restauração do Sorteio e Correções de UI

Foi detectado que a funcionalidade de "Sorteio" desapareceu do dashboard do evento após a última atualização. Este plano visa restaurar o acesso e garantir a estabilidade do build do frontend.

## Agentes Envolvidos (Mínimo 3)
1. **project-planner**: Coordenação do plano de restauração.
2. **frontend-specialist**: Correção visual e adição do link faltante.
3. **test-engineer**: Verificação completa do build e links operacionais.

## Alterações Propostas

### Frontend

#### [MODIFY] [page.tsx](file:///home/thiago/Projetos/eventhub/frontend/src/app/dashboard/events/[id]/page.tsx)
- Restaurar o link de Sorteio (Operations Raffle).
- Adicionar o link de Equipe de Monitores (Operations Monitors).
- Manter o link de Scanner Check-in.

#### [VERIFY] [team/page.tsx](file:///home/thiago/Projetos/eventhub/frontend/src/app/dashboard/settings/team/page.tsx)
- Garantir que não há mais referências a componentes Shadcn/UI (Dialog, Input, Table, etc.) e sim ao Tailwind puro conforme a última correção.

## Plano de Verificação

### Automação (test-engineer)
- `npm run build` no diretório `/frontend`.

### Testes Manuais
- Verificar se os 3 botões de operação estão visíveis e funcionais.
