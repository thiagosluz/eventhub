import type { JobsOptions } from "bullmq";

/**
 * Opções padrão aplicadas a todos os jobs enfileirados pelo sistema.
 *
 * - `attempts: 3` + backoff exponencial dão 3 tentativas (2s, 4s, 8s) antes
 *   do job ser marcado como `failed`. Ajustável por job (`opts.attempts`).
 * - `removeOnComplete` mantém os 100 últimos jobs concluídos (até 24h) para
 *   inspeção via dashboard; os antigos são removidos do Redis.
 * - `removeOnFail` mantém 500 falhas (até 7 dias) para diagnóstico.
 */
export const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: { count: 100, age: 24 * 60 * 60 },
  removeOnFail: { count: 500, age: 7 * 24 * 60 * 60 },
};

/**
 * Nome canônico de todas as filas BullMQ do sistema. Usado pelo dashboard
 * administrativo e para garantir que `BullModule.registerQueue` seja
 * consistente em todos os módulos.
 */
export const QUEUE_NAMES = [
  "assign-reviews",
  "activities",
  "emails",
  "kanban-alerts",
] as const;

export type QueueName = (typeof QUEUE_NAMES)[number];
