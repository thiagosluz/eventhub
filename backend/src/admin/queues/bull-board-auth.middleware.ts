import type { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

interface AdminJwtPayload {
  sub: string;
  email?: string;
  role?: string;
  exp?: number;
}

const COOKIE_NAME = "eh_admin_token";
const COOKIE_PATH = "/admin/queues";

/**
 * Middleware Express que protege o Bull Board com JWT + role SUPER_ADMIN.
 *
 * Aceita o token via:
 *  1. `Authorization: Bearer <token>` (uso programático, ex. curl)
 *  2. Cookie `eh_admin_token` (definido pela UI quando navegamos ao dashboard)
 *  3. Query string `?token=<jwt>` (útil para abrir o painel direto do
 *     dashboard admin, que injeta o token atual na URL).
 *
 * Qualquer falha responde 401/403 em texto simples (o UI de login do
 * bull-board é minimalista; erros verbosos tornam o debug mais rápido).
 */
export function buildBullBoardAuthMiddleware(
  secret: string,
  options: { allowedFrameOrigins?: string[] } = {},
) {
  const frameOrigins = options.allowedFrameOrigins?.filter(Boolean) ?? [];

  return function bullBoardAuth(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Permite o frontend autenticado embedar o dashboard via iframe.
    // `X-Frame-Options` (setado pelo helmet) é substituído por uma CSP
    // `frame-ancestors` com a lista explícita de origens permitidas.
    res.removeHeader("X-Frame-Options");
    if (frameOrigins.length > 0) {
      res.setHeader(
        "Content-Security-Policy",
        `frame-ancestors 'self' ${frameOrigins.join(" ")}`,
      );
    } else {
      res.setHeader("Content-Security-Policy", "frame-ancestors 'self'");
    }

    const extracted = extractToken(req);
    if (!extracted) {
      res.status(401).send("Missing authentication token.");
      return;
    }

    try {
      const payload = jwt.verify(extracted.token, secret) as AdminJwtPayload;
      if (payload.role !== "SUPER_ADMIN") {
        res.status(403).send("Only Super Admins can access this dashboard.");
        return;
      }

      // Persiste o token em cookie escopado na rota do Bull Board. Assim os
      // assets estáticos (`/admin/queues/static/*`) e as chamadas da SPA que
      // não reencaminham o `?token=` continuam autenticadas. O TTL do cookie
      // segue o `exp` do JWT para evitar sessões "fantasmas".
      if (extracted.source !== "cookie") {
        const maxAgeSec = payload.exp
          ? Math.max(0, payload.exp - Math.floor(Date.now() / 1000))
          : 15 * 60;
        res.cookie(COOKIE_NAME, extracted.token, {
          httpOnly: true,
          sameSite: "lax",
          secure: req.secure,
          path: COOKIE_PATH,
          maxAge: maxAgeSec * 1000,
        });
      }

      next();
    } catch {
      res.status(401).send("Invalid or expired token.");
    }
  };
}

type TokenSource = "header" | "query" | "cookie";

function extractToken(
  req: Request,
): { token: string; source: TokenSource } | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return { token: header.slice("Bearer ".length).trim(), source: "header" };
  }

  const queryToken = req.query?.token;
  if (typeof queryToken === "string" && queryToken.length > 0) {
    return { token: queryToken, source: "query" };
  }

  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${COOKIE_NAME}=`));
    if (match) {
      return {
        token: decodeURIComponent(match.slice(`${COOKIE_NAME}=`.length)),
        source: "cookie",
      };
    }
  }

  return null;
}
