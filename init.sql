-- Seed inicial do banco EventHub
-- Este arquivo é executado automaticamente pelo container do Postgres
-- via /docker-entrypoint-initdb.d/init.sql

-- Criar extensão para UUIDs (útil para Prisma mais tarde, se desejado)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar schema base para a aplicação (Prisma pode usar schemas diferentes depois)
CREATE SCHEMA IF NOT EXISTS core;

-- Exemplo de tabela de controle simples (pode ser removida ou adaptada quando o Prisma entrar)
CREATE TABLE IF NOT EXISTS core.migrations_bootstrap (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO core.migrations_bootstrap (label)
VALUES ('initial-seed')
ON CONFLICT DO NOTHING;

