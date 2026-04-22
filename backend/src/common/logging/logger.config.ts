import { randomUUID } from "crypto";
import { IncomingMessage, ServerResponse } from "http";
import type { Params } from "nestjs-pino";

const REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  'req.headers["set-cookie"]',
  "req.body.password",
  "req.body.newPassword",
  "req.body.currentPassword",
  "req.body.refresh_token",
  "req.body.token",
  'res.headers["set-cookie"]',
];

const DEFAULT_LOG_LEVEL =
  process.env.NODE_ENV === "production" ? "info" : "debug";

export function buildLoggerOptions(): Params {
  const logLevel = process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL;

  const isDev = process.env.NODE_ENV !== "production";

  return {
    pinoHttp: {
      level: logLevel,
      redact: { paths: REDACT_PATHS, censor: "[REDACTED]" },
      genReqId: (req: IncomingMessage, res: ServerResponse) => {
        const existing =
          (req.headers["x-request-id"] as string | undefined) ||
          (req.headers["x-correlation-id"] as string | undefined);
        const id = existing && existing.length > 0 ? existing : randomUUID();
        res.setHeader("x-request-id", id);
        return id;
      },
      customLogLevel: (_req, res, err) => {
        const status = res.statusCode;
        if (err || status >= 500) return "error";
        if (status >= 400) return "warn";
        if (status >= 300) return "silent";
        return "info";
      },
      customSuccessMessage: (req, res) =>
        `${(req as IncomingMessage).method} ${(req as IncomingMessage).url} -> ${res.statusCode}`,
      customErrorMessage: (req, res, err) =>
        `${(req as IncomingMessage).method} ${(req as IncomingMessage).url} -> ${res.statusCode} (${err?.name ?? "Error"})`,
      autoLogging: {
        ignore: (req: IncomingMessage) => req.url === "/health",
      },
      transport: isDev
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              singleLine: true,
              translateTime: "HH:MM:ss.l",
              ignore: "pid,hostname,req.headers,res.headers,responseTime",
            },
          }
        : undefined,
      serializers: {
        req(
          req: IncomingMessage & { id?: string; method: string; url: string },
        ) {
          return {
            id: req.id,
            method: req.method,
            url: req.url,
          };
        },
        res(res: ServerResponse) {
          return { statusCode: res.statusCode };
        },
      },
    },
  };
}
