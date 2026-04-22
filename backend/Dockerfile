# syntax=docker/dockerfile:1.7
# =============================================================================
# EventHub Backend — Multi-stage Dockerfile
# =============================================================================

ARG NODE_VERSION=24

# -----------------------------------------------------------------------------
# 1) deps: instala dependências com cache
# -----------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app

# Deps nativas (argon2, prisma, pdfkit exigem build toolchain e libs)
RUN apk add --no-cache python3 make g++ openssl libc6-compat

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# Gera o Prisma Client
RUN npx prisma generate

# -----------------------------------------------------------------------------
# 2) build: compila TypeScript
# -----------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate \
    && npm run build \
    && npm prune --omit=dev

# -----------------------------------------------------------------------------
# 3) runner: imagem final enxuta
# -----------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

RUN apk add --no-cache openssl libc6-compat wget \
    && addgroup -S nodejs -g 1001 \
    && adduser -S nestjs -u 1001 -G nodejs

COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=build --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nestjs:nodejs /app/prisma.config.ts ./prisma.config.ts

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:${PORT}/health || exit 1

CMD ["node", "dist/main.js"]
