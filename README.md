# 📚 EventHub — Plataforma de Gestão de Eventos

> Plataforma multi-tenant robusta para gestão de eventos acadêmicos e corporativos, desenvolvida com tecnologias de ponta para 2026.

---

## 🏗️ Estrutura do Projeto

O EventHub é dividido em dois grandes pilares:
- **`backend/`**: Servidor robusto em NestJS, utilizando Prisma e PostgreSQL.
- **`frontend/`**: Aplicação interativa em Next.js com React e Tailwind CSS v4.
- **`docs/`**: Central de documentação técnica detalhada.

---

## 🚀 Guia de Implantação Rápida

Você pode rodar o EventHub utilizando Docker para a infraestrutura ou configurar tudo manualmente.

### 🐳 Opção 1: Via Docker (Recomendado para Infra)

Certifique-se de ter **Docker** e **Docker Compose** instalados.

```bash
# Na raiz do projeto, suba o PostgreSQL, Redis e MinIO
docker compose up -d --build

# Verifique o status dos containers
docker compose ps
```

### 💻 Opção 2: Execução Local (Desenvolvimento)

#### 1. Configuração do Backend
```bash
cd backend
npm install
cp .env.example .env    # Configure suas variáveis de ambiente
npm run prisma:migrate
npm run prisma:generate
npm run start:dev
```

#### 2. Configuração do Frontend
```bash
cd frontend
npm install
npm run dev -- --port 3001
```

---

## 📖 Documentação Técnica

Toda a documentação detalhada foi centralizada na pasta `docs/`. Acesse os guias específicos abaixo:

- [📚 Índice de Documentação](./docs/README.md)
- [🛠️ Guia de Instalação Detalhado](./docs/instalacao.md)
- [📐 Arquitetura do Sistema](./docs/arquitetura.md)
- [🗄️ Estrutura do Banco de Dados](./docs/banco-de-dados.md)
- [🔌 Referência da API (Swagger)](./docs/api-referencia.md)
- [✨ Módulos e Funcionalidades](./docs/modulos-funcionalidades.md)
- [🧪 Estratégia de Testes](./docs/testes.md)

---

## 🔐 Credenciais de Teste

Para acessar o sistema após rodar o *seed* do banco (`cd backend && npx prisma db seed`), utilize:

| E-mail | Senha | Role |
|--------|:-----:|------|
| `admin@eventhub.com.br` | `123456` | Administrador |
| `participante@eventhub.com.br` | `123456` | Participante |
| `revisor@eventhub.com.br` | `123456` | Revisor |

---

## 📄 Licença

Este projeto é distribuído sob a **Licença MIT**. Consulte o arquivo [LICENSE](./LICENSE) para mais detalhes.

---
*EventHub - 2026*
