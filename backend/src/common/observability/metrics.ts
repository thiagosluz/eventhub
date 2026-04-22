import type { INestApplication } from "@nestjs/common";
import type { Request, Response } from "express";
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from "prom-client";

let metricsRegistry: Registry | null = null;
let httpRequestsCounter: Counter<string> | null = null;
let httpDurationHistogram: Histogram<string> | null = null;

export function isMetricsEnabled(): boolean {
  return (process.env.ENABLE_METRICS || "").toLowerCase() === "true";
}

function ensureRegistry(): Registry {
  if (metricsRegistry) return metricsRegistry;
  const registry = new Registry();
  collectDefaultMetrics({ register: registry });

  httpRequestsCounter = new Counter({
    name: "http_requests_total",
    help: "Total HTTP requests",
    labelNames: ["method", "route", "status"],
    registers: [registry],
  });

  httpDurationHistogram = new Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration (seconds)",
    labelNames: ["method", "route", "status"],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [registry],
  });

  metricsRegistry = registry;
  return registry;
}

function sanitizeRoute(req: Request): string {
  const route = (req.route?.path ||
    req.baseUrl + req.path ||
    req.path ||
    req.url) as string;
  return route.length > 120 ? route.slice(0, 120) : route;
}

export function registerPrometheus(app: INestApplication): void {
  if (!isMetricsEnabled()) return;
  const registry = ensureRegistry();
  const server = app.getHttpAdapter().getInstance();

  server.use((req: Request, res: Response, next: () => void) => {
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      const durationSec = Number(process.hrtime.bigint() - start) / 1e9;
      const route = sanitizeRoute(req);
      const labels = {
        method: req.method,
        route,
        status: String(res.statusCode),
      };
      httpRequestsCounter?.inc(labels);
      httpDurationHistogram?.observe(labels, durationSec);
    });
    next();
  });

  server.get("/metrics", async (_req: Request, res: Response) => {
    res.setHeader("Content-Type", registry.contentType);
    res.end(await registry.metrics());
  });
}
