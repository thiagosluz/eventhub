# Plano de Implementação: Painel de Saúde do Sistema (Opção B)

Este plano descreve a implementação de um dashboard de monitoramento de integridade para o Superadmin, utilizando NestJS Terminus no backend e uma interface dedicada no frontend.

## 📋 Escopo
- **Backend:** Monitoramento de Banco de Dados (Prisma) e E-mail (SMTP).
- **Latência:** Rastreamento do tempo de resposta da API via Interceptor.
- **Frontend:** Visualização de status em tempo real no dashboard do Superadmin.
- **Segurança:** Acesso restrito via `SuperAdminGuard`.

## 🛠️ Arquitetura Proposta

### Phase 1: Planning & Setup
1. Instalação das dependências necessárias no backend (@nestjs/terminus).
2. Definição da estrutura do `HealthModule`.

#### [NEW] [health.controller.ts](file:///home/thiago/Projetos/eventhub/backend/src/health/health.controller.ts)
- Endpoints `@Get('admin/health')` protegidos por `SuperAdminGuard`.
- Retorno detalhado de cada componente (DB, Email, Storage).

### Phase 2: Backend Implementation (Foundation)
1. **HealthModule & Controller:** Criar `src/health` com endpoints para check de saúde.
2. **Prisma Indicator:** Configurar health check para o Prisma.
3. **Email Indicator:** Implementar um custom health indicator para testar a conexão SMTP do `nodemailer`.
4. **S3 Indicator:** Implementar um custom health indicator para verificar a conectividade com o bucket S3.
5. **ResponseTime Interceptor:** Criar um interceptor em `src/common/interceptors` para medir a latência e injetar no header `X-Response-Time`.

### Phase 3: Frontend Implementation (Core)
1. **Health Page:** Criar `src/app/(admin)/admin/health/page.tsx`.
2. **Status Components:** Cards de status com indicadores visuais (Sinalizador Verde/Vermelho) e atualização automática a cada 60s.
3. **Latency Gauge:** Exibição da latência média da API em tempo real.

### Phase 4: Verification (Polish)
1. Testes de falha simulada (ex: desligar DB local) para validar os status.
2. Auditoria de segurança para garantir que apenas superadmins acessem.

---

## 🎼 Orchestration Roles
- `backend-specialist`: Implementação do HealthModule e Interceptor.
- `frontend-specialist`: Desenvolvimento da interface no dashboard.
- `test-engineer`: Validação e scripts de verificação.
