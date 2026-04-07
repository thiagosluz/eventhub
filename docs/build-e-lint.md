# Guia de Build, Lint e Deploy

Durante o desenvolvimento ou no momento do deploy para produção, nós utilizamos processos de **build** (para empacotar/compilar o código de forma otimizada) e de **lint** (para varrer problemas de padronização, ortografia ou sintaxe).

---

## 🏗️ 1. Comandos de Build

O build gera os arquivos finais otimizados que serão efetivamente lidos e rodados pelo servidor de hospedagem.

### 🖥️ Frontend (Next.js)

Para iniciar o build da interface:
```bash
cd frontend
npm run build
```

**O que acontece:**
- O Next.js irá gerar bundles super reduzidos e otimizados de HTML/CSS/JS para a web.
- As páginas estáticas são geradas e agrupadas dentro da pasta `.next/`, prontas para serem veiculadas em produção.
- Para iniciar em modo produção após o build: `npm run start`.

### ⚙️ Backend (NestJS / Node.js)

Para compilar o código do lado do servidor:
```bash
cd backend
npm run build
```

**O que acontece:**
- O TypeScript (do pacote `tsc`) transforma todo o código moderno (`.ts`) em código JavaScript convencional compatível com qualquer servidor Node.
- Os arquivos compilados são empacotados na pasta `dist/`.
- Para iniciar em modo produção após o build: `npm run start`.

---

## 🧹 2. Comandos de Lint (ESLint)

O processo de **linting** valida se você está seguindo as regras de formatação estipuladas na equipe. Ele ajuda a banir "variáveis não usadas", "importações esquecidas", etc.

### 🖥️ Frontend

```bash
cd frontend
npm run lint
```

### ⚙️ Backend

1. **Exibir os erros:**
```bash
cd backend
npm run lint
```

2. **Corrigir automaticamente:** *(Útil para arrumar espaçamentos e aspas mal colocadas de uma vez)*
```bash
cd backend
npm run lint:fix
```

### Configuração do ESLint

| Projeto | Arquivo | Extensão |
|---------|---------|----------|
| Backend | `eslint.config.mjs` | ESLint v10 (flat config) + TypeScript |
| Frontend | `eslint.config.mjs` | ESLint v9 + eslint-config-next |

---

## 📦 3. Dependências e Versões

### Backend

| Dependência Core | Versão |
|------------------|--------|
| NestJS | 11.1.17 |
| Prisma | 7.6.0 |
| TypeScript | 5.9.3 |
| Jest | 29.7.0 |
| ESLint | 10.1.0 |

### Frontend

| Dependência Core | Versão |
|------------------|--------|
| Next.js | 16.2.1 |
| React | 19.2.4 |
| TypeScript | 5.x |
| Tailwind CSS | 4.x |
| Vitest | 4.1.2 |
| Playwright | 1.58.2 |

---

## 🐳 4. Build para Produção (Docker)

Para um deploy completo, os serviços de infraestrutura são gerenciados pelo `docker-compose.yml` na raiz:

```bash
# Subir toda a infraestrutura
docker compose up -d --build

# Verificar status
docker compose ps

# Ver logs
docker compose logs -f

# Parar tudo
docker compose down
```

### Containers

| Container | Imagem | Porta |
|-----------|--------|:-----:|
| `eventhub-postgres` | `postgres:16-alpine` | 5432 |
| `eventhub-redis` | `redis:7-alpine` | 6379 |
| `eventhub-minio` | `minio/minio:latest` | 9000/9001 |

---

## 🔄 5. Fluxo de CI/CD Sugerido

```
1. git push → CI Pipeline
2. Instalar dependências   → npm install (backend + frontend)
3. Lint                     → npm run lint (backend + frontend)
4. Build                    → npm run build (backend + frontend)
5. Testes unitários         → npm run test (backend) + npm run test (frontend)
6. Testes E2E               → npm run test:e2e (backend, precisa de Docker)
7. Deploy                   → Se todos os passos passarem
```

> **Dica Final:** É uma excelente prática acostumar-se a rodar o comando de `lint` e `test` antes de abrir as Pull Requests ou realizar *commits*, garantindo um código sempre legível e sadio.
