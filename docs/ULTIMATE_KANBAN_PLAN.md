# Plano de Orquestração: Ultimate Kanban (Hybrid Pro)

Este plano coordena a implementação do módulo de gestão de tarefas inteligente para organizadores de eventos.

## 🎯 Objetivo
Transformar a gestão operacional dos eventos em uma experiência integrada e automatizada, unindo um quadro Kanban flexível com automações baseadas no cronograma e visualização de prazos (Gantt).

## 👥 Agentes e Responsabilidades
- **`database-architect`**: Expansão do Prisma Schema para suportar quadros, tarefas e atribuições.
- **`backend-specialist`**: Implementação da API de CRUD e do motor de automação (triggers de atividade).
- **`frontend-specialist`**: Desenvolvimento da UI Premium com Drag & Drop, Timeline view e Workload indicators.
- **`test-engineer`**: Garantia de que a automação e as reordenações funcionam via testes unitários e E2E.

## 📅 Roadmap de Implementação
1. **[Fase 1] Fundação de Dados**: Migração do Prisma e criação do módulo base no NestJS.
2. **[Fase 2] Motor de Inteligência**: Implementação dos hooks de automação (atividades sem palestrante) e BullMQ para atrasos.
3. **[Fase 3] Interface Kanban & Gantt**: Desenvolvimento dos componentes visuais no Next.js.
4. **[Fase 4] Polimento e Vistas Especiais**: Implementação da barra de carga de trabalho e do modo "Dia do Evento".
5. **[Fase 5] Validação**: Execução de bateria de testes e documentação técnica.

## 🏁 Critérios de Sucesso
- Kanban funcional com drag & drop persistente.
- Auto-geração de cards ao detectar inconsistências no cronograma.
- Notificações enviadas logicamente para tarefas próximas ao prazo.
- Mudança visual clara para o modo "Dia do Evento".
