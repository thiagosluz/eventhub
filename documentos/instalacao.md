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
   *(Verifique se as credenciais do banco de dados no `.env` estão corretas de acordo com as definidas no `docker-compose.yml` - Ex: Usuário/Senha/DB `eventhub`)*.

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
   *Se necessário, também crie um arquivo `.env` baseando-se no `.env.example`, caso ele exista.*

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

- **Administrador:** `admin@eventhub.com.br`
- **Organizador:** `organizador@eventhub.com.br`
- **Participante:** `participante@eventhub.com.br`
- **Revisor:** `revisor@eventhub.com.br`

---
*Pronto! O seu ambiente local está totalmente configurado e pronto para uso e desenvolvimento.*
