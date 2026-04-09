# Plano de Orquestração: Configuração do MailHog

Este documento coordena a implementação do serviço de e-mail local (MailHog) no EventHub.

## 🎯 Objetivo
Configurar o MailHog via Docker Compose, integrar com o backend NestJS para garantir que o envio de e-mails funcione localmente, adicionar cobertura de testes (unitários/E2E) e documentar o processo.

## 👥 Agentes Envolvidos
- `devops-engineer`: Configuração do `docker-compose.yml`.
- `backend-specialist`: Ajustes de integração e variáveis de ambiente.
- `test-engineer`: Criação de testes unitários e E2E.
- `documentation-writer`: Criação de manuais e atualização do README.

## 📅 Chronograma
1. **[PHASE 1] Planejamento e Design**: Criação deste documento e validação inicial.
2. **[PHASE 2] Execução (Paralela)**:
   - Setup do Docker (MailHog).
   - Verificação da integração no backend.
   - Implementação da suíte de testes.
   - Escrita da documentação técnica.
3. **[PHASE 3] Validação Final**: execução de todos os testes e verificação do dashboard de saúde.

## 🏁 Critérios de Aceitação
- O serviço `mailhog` deve estar rodando no Docker.
- O Dashboard de Saúde deve mostrar o serviço de e-mail como "Online".
- 100% de sucesso nos novos testes unitários e E2E.
- Documentação `docs/EMAIL_SETUP.md` disponível.
