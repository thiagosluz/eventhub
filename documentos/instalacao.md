# Guia de Instalação e Execução Local do EventHub

Este documento fornece o passo a passo para configurar e rodar o projeto **EventHub** localmente pela primeira vez.

## Pré-requisitos
Certifique-se de ter instalado em sua máquina:
- **Git**
- **Docker** e **Docker Compose**
- **Node.js** (versão 18+ recomendada) e **npm**

---

## Passo 1: Clonar o Repositório

Abra o terminal e execute o comando abaixo para clonar o repositório e entrar na pasta do projeto:

```bash
git clone <URL_DO_REPOSITORIO> eventhub
cd eventhub
```

---

## Passo 2: Subir a Infraestrutura (Docker)

O projeto utiliza o Docker para rodar os serviços essenciais (PostgreSQL, Redis e MinIO).

Na raiz do projeto (`/eventhub`), execute o comando para construir e iniciar os containers em segundo plano (opção `-d`):

```bash
docker compose up -d --build
```

Isso fará com que o banco de dados (na porta 5432), o Redis (na porta 6379) e o MinIO (nas portas 9000/9001) fiquem disponíveis para a aplicação.

### Verificar se os containers estão rodando:

```bash
docker compose ps
```

Resultado esperado (3 containers running):
- `eventhub-postgres` — PostgreSQL 16 (porta 5432)
- `eventhub-redis` — Redis 7 (porta 6379)
- `eventhub-minio` — MinIO (portas 9000/9001)

---

## Passo 3: Configurar e Rodar o Backend

Abra um novo terminal (ou aba) e navegue até a pasta do backend:

```bash
cd backend
```

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configuração de Ambiente:**
   Certifique-se de que existe um arquivo `.env` na pasta `backend`. Se não existir, crie uma cópia a partir do arquivo de exemplo:
   ```bash
   cp .env.example .env
   ```
   
   > **Variáveis padrão do `.env`:**
   > - `DATABASE_URL` — Conexão com PostgreSQL (`postgresql://eventhub:eventhub@localhost:5432/eventhub`)
   > - `JWT_SECRET` — Chave secreta para tokens JWT
   > - `REDIS_HOST` / `REDIS_PORT` — Conexão com Redis
   > - `SMTP_*` — Configuração de e-mail (opcional em dev)
   > - `MAIL_FROM` — Remetente de e-mails
   > 
   > Verifique se as credenciais do banco estão alinhadas com o `docker-compose.yml`.

3. **Banco de Dados (Migrations e Prisma Client):**
   Execute as migrations para criar as tabelas no PostgreSQL e gere o cliente de acesso aos dados:
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

4. **Popular o Banco com Dados Iniciais (Seeding):**
   Para conseguir acessar o sistema sem precisar criar um usuário manualmente no banco de dados, rode o comando abaixo para inserir os registros iniciais (incluindo usuários de teste):
   ```bash
   npx prisma db seed
   ```

5. **Iniciar o Servidor:**
   Agora, suba o backend em modo de desenvolvimento:
   ```bash
   npm run start:dev
   ```

   O servidor estará disponível em: **`http://localhost:3000`**

   > A documentação da API (Swagger) estará em: **`http://localhost:3000/api/docs`**

---

## Passo 4: Configurar e Rodar o Frontend

Abra mais um terminal e navegue até a pasta do frontend a partir da raiz do projeto:

```bash
cd frontend
```

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Iniciar a Aplicação:**
   Inicie o servidor de desenvolvimento do Next.js (utilizando a porta 3001 para evitar conflitos):
   ```bash
   npm run dev -- --port 3001
   ```

---

## Passo 5: Primeiro Acesso

Com tudo rodando corretamente, abra seu navegador de preferência e acesse:

**📍 [http://localhost:3001](http://localhost:3001)**

Para realizar o login inicial, utilize os dados criados durante a etapa de *seed* do backend. As credenciais padrões disponíveis são (Senha para todos: `123456`):

| E-mail | Role | Acesso |
|--------|------|--------|
| `admin@eventhub.com.br` | Administrador (ORGANIZER) | Dashboard completo |
| `organizador@eventhub.com.br` | Organizador (ORGANIZER) | Dashboard completo |
| `participante@eventhub.com.br` | Participante (PARTICIPANT) | Portal público + Perfil |
| `revisor@eventhub.com.br` | Revisor (REVIEWER) | Dashboard + Painel de revisão |

---

## Portas Utilizadas

| Serviço | Porta | URL |
|---------|:-----:|-----|
| Frontend (Next.js) | 3001 | http://localhost:3001 |
| Backend (NestJS) | 3000 | http://localhost:3000 |
| API Docs (Swagger) | 3000 | http://localhost:3000/api/docs |
| PostgreSQL | 5432 | - |
| Redis | 6379 | - |
| MinIO (S3 API) | 9000 | - |
| MinIO (Console) | 9001 | http://localhost:9001 |

---

## Comandos Úteis (Referência Rápida)

### Backend

```bash
npm run start:dev      # Iniciar backend em dev
npm run build          # Build de produção
npm run test           # Testes unitários
npm run test:cov       # Testes com cobertura
npm run test:e2e       # Testes end-to-end
npm run lint           # Verificar linting
npm run lint:fix       # Corrigir linting automaticamente
npm run prisma:migrate # Rodar migrations
npm run prisma:generate # Gerar Prisma Client
npx prisma db seed     # Rodar seed
npx prisma studio      # Abrir Prisma Studio (GUI do banco)
```

### Frontend

```bash
npm run dev            # Iniciar frontend em dev
npm run build          # Build de produção
npm run lint           # Verificar linting
npm run test           # Testes unitários (Vitest)
npm run test:e2e       # Testes E2E (Playwright)
```

### Docker

```bash
docker compose up -d --build  # Subir infraestrutura
docker compose ps             # Verificar status
docker compose down           # Parar infraestrutura
docker compose logs -f        # Ver logs em tempo real
```

---

## Solução de Problemas

### Erro de conexão com banco de dados
- Verifique se os containers Docker estão rodando: `docker compose ps`
- Confirme se a `DATABASE_URL` no `.env` está correta
- Tente reiniciar: `docker compose down && docker compose up -d --build`

### Porta já em uso
- Verifique processos ocupando a porta: `lsof -i :3000` ou `lsof -i :3001`
- Encerre o processo: `kill -9 <PID>`

### Erro nas migrations
- Se houver conflito, tente resetar: `npx prisma migrate reset`
- Isso apaga todos os dados e recria tudo do zero

### MinIO não conecta
- Verifique se o container está rodando na porta 9000
- Console MinIO: http://localhost:9001 (Login: `minioadmin` / `minioadmin`)

---
*Pronto! O seu ambiente local está totalmente configurado e pronto para uso e desenvolvimento.*
