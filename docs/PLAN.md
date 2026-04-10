# Plano de Implementação: Normalização de Tema do Kanban

O objetivo deste plano é ajustar os modais do sistema Kanban (Gerenciamento de Colunas, Modal de Tarefas e Modal de Confirmação) para que sigam o tema claro do restante da aplicação, removendo classes de estilo dark hardcoded.

## Problema Identificado
Os modais `ColumnManagerModal`, `ConfirmModal` e `TaskModal` possuem classes como `bg-gray-950`, `border-gray-800` e `text-white` fixas, o que faz com que eles permaneçam em modo escuro mesmo quando o sistema está em modo claro.

## Mudanças Propostas

### Frontend

#### [MODIFY] [ColumnManagerModal.tsx](file:///home/thiago/Projetos/eventhub/frontend/src/components/dashboard/kanban/ColumnManagerModal.tsx)
- Substituir `bg-gray-950/95` por `bg-background`.
- Substituir `border-gray-800` e `border-gray-800/50` por `border-border`.
- Substituir `hover:bg-gray-900` por `hover:bg-muted`.
- Substituir `text-white` por `text-foreground`.
- Ajustar cores de ícones e textos secundários para usar classes semânticas (`text-muted-foreground`).

#### [MODIFY] [ConfirmModal.tsx](file:///home/thiago/Projetos/eventhub/frontend/src/components/dashboard/kanban/ConfirmModal.tsx)
- Substituir `bg-gray-950/95` por `bg-background`.
- Substituir `border-gray-800` por `border-border`.
- Substituir `bg-gray-900/30` por `bg-muted/30`.
- Substituir `hover:bg-gray-900` por `hover:bg-muted`.
- Ajustar cores de textos para consistência.

#### [MODIFY] [TaskModal.tsx](file:///home/thiago/Projetos/eventhub/frontend/src/components/dashboard/kanban/TaskModal.tsx)
- Substituir `bg-gray-950/95` por `bg-background`.
- Substituir `border-gray-800` e `border-gray-800/50` por `border-border`.
- Substituir `bg-gray-900/30` por `bg-muted/30`.
- Substituir `bg-gray-950/20` por `bg-muted/10`.
- Substituir todos os `text-white` por `text-foreground` ou remover se o padrão for suficiente.
- Ajustar placeholders e inputs para serem legíveis em modo claro.

## Plano de Verificação

### Verificação Manual
1. Abrir a rota do Kanban: `http://localhost:3001/dashboard/events/[id]/kanban`.
2. Abrir o modal "Gerenciar Colunas" e verificar se o fundo está claro e o texto legível.
3. Abrir o modal de criação/edição de tarefas e verificar a consistência.
4. Tentar excluir uma coluna/tarefa para ver o `ConfirmModal`.
5. Verificar interações (hover, drag and drop) nos novos estilos.

### Testes Automatizados
- Executar `npm test` no frontend para garantir que nenhuma lógica foi quebrada.
- Executar o script de lint: `python .agent/skills/lint-and-validate/scripts/lint_runner.py .`.
