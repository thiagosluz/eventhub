import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

let enabled = false;

export function isSentryEnabled(): boolean {
  return enabled;
}

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    enabled = false;
    return;
  }

  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? 0),
    integrations: [nodeProfilingIntegration()],
  });
  enabled = true;
}

export function captureException(
  err: unknown,
  context?: Record<string, unknown>,
) {
  if (!enabled) return;
  Sentry.captureException(err, { extra: context });
}

export { Sentry };
