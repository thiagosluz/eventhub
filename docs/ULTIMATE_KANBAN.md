# Ultimate Kanban System (Hybrid Pro)

Este documento descreve a infraestrutura e as funcionalidades do novo sistema de gestão de tarefas (Kanban) do EventHub.

## 🏗️ Arquitetura
O sistema foi construído para ser proativo e integrado ao cronograma do evento.

### Componentes de Backend
- **KanbanModule**: Módulo principal que expõe a API para quadros, colunas e tarefas.
- **KanbanService**: Gerencia o CRUD e a lógica de auto-instanciação de quadros por evento.
- **KanbanAutomationService**: Monitora mudanças nas `Activities` e gera cards automaticamente (ex: palestrante ausente).
- **KanbanAlertsProcessor**: Consumidor BullMQ que dispara e-mails de alerta para prazos próximos.

### Componentes de Frontend
- **KanbanBoard**: Interface de arrastar e soltar (DnD) para fluxo de trabalho com **colunas coloridas personalizáveis**.
- **GanttView**: Visualização de linha do tempo para controle de prazos.
- **WorkloadSidebar**: Dashboard lateral para equilíbrio de carga de trabalho entre monitores.
- **Modo Alta Prioridade**: Interface otimizada para o dia do evento, com foco em resolução rápida.
- **Personalização Visual**: Suporte a 10 cores pré-definidas para categorização visual de colunas.

## 🤖 Automações Nativa
O sistema gera tarefas automaticamente nos seguintes cenários:
1. **Atividade sem Palestrante**: Se uma atividade é criada ou editada sem palestrantes vinculados.
2. **Alertas de Prazo**: Notificações 24h antes do vencimento de uma tarefa não concluída.

## 📋 Como Acessar
Navegue para: `Admin > Eventos > [Evento] > Quadro Kanban`

## 🛠️ Manutenção
Para adicionar novas regras de automação, edite o `KanbanAutomationService` no backend. A interface utiliza `@dnd-kit` e `framer-motion` para garantir uma experiência premium.
