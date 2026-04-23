import type { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { buildBullBoardAuthMiddleware } from "./bull-board-auth.middleware";

const SECRET = "test-bull-board-secret";

function makeRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockImplementation(() => res as Response);
  res.send = jest.fn().mockImplementation(() => res as Response);
  res.setHeader = jest.fn().mockImplementation(() => res as Response);
  res.removeHeader = jest.fn().mockImplementation(() => res as Response);
  res.cookie = jest.fn().mockImplementation(() => res as Response);
  return res as Response;
}

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    query: {},
    secure: false,
    ...overrides,
  } as Request;
}

describe("bull-board auth middleware", () => {
  const middleware = buildBullBoardAuthMiddleware(SECRET);
  const validToken = jwt.sign({ sub: "u1", role: "SUPER_ADMIN" }, SECRET);
  const orgToken = jwt.sign({ sub: "u2", role: "ORGANIZER" }, SECRET);

  it("chama next() quando token válido de SUPER_ADMIN está no header", () => {
    const req = makeReq({
      headers: { authorization: `Bearer ${validToken}` },
    });
    const res = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("aceita token via query string", () => {
    const req = makeReq({ query: { token: validToken } });
    const res = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("aceita token via cookie eh_admin_token", () => {
    const req = makeReq({
      headers: { cookie: `eh_admin_token=${encodeURIComponent(validToken)}` },
    });
    const res = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("retorna 401 quando não há token", () => {
    const res = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    middleware(makeReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("retorna 401 quando token é inválido", () => {
    const req = makeReq({ headers: { authorization: "Bearer not.a.jwt" } });
    const res = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("retorna 403 quando role é diferente de SUPER_ADMIN", () => {
    const req = makeReq({
      headers: { authorization: `Bearer ${orgToken}` },
    });
    const res = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("seta cookie eh_admin_token quando autentica via query (para assets estáticos)", () => {
    const req = makeReq({ query: { token: validToken } });
    const res = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    middleware(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith(
      "eh_admin_token",
      validToken,
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/admin/queues",
      }),
    );
    expect(next).toHaveBeenCalled();
  });

  it("seta cookie eh_admin_token quando autentica via header Authorization", () => {
    const req = makeReq({
      headers: { authorization: `Bearer ${validToken}` },
    });
    const res = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    middleware(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith(
      "eh_admin_token",
      validToken,
      expect.any(Object),
    );
  });

  it("não reseta cookie quando a própria requisição já veio autenticada por cookie", () => {
    const req = makeReq({
      headers: { cookie: `eh_admin_token=${encodeURIComponent(validToken)}` },
    });
    const res = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    middleware(req, res, next);

    expect(res.cookie).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("define frame-ancestors CSP com as origens permitidas e remove X-Frame-Options", () => {
    const custom = buildBullBoardAuthMiddleware(SECRET, {
      allowedFrameOrigins: [
        "http://localhost:3001",
        "https://app.eventhub.dev",
      ],
    });
    const req = makeReq({
      headers: { authorization: `Bearer ${validToken}` },
    });
    const res = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    custom(req, res, next);

    expect(res.removeHeader).toHaveBeenCalledWith("X-Frame-Options");
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Security-Policy",
      "frame-ancestors 'self' http://localhost:3001 https://app.eventhub.dev",
    );
    expect(next).toHaveBeenCalled();
  });
});
