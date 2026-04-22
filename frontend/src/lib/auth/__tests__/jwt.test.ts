import { describe, it, expect } from "vitest";
import { decodeJwt, isJwtExpired } from "../jwt";

function makeToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const body = Buffer.from(JSON.stringify(payload))
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${header}.${body}.signature`;
}

describe("decodeJwt", () => {
  it("returns null for empty/invalid tokens", () => {
    expect(decodeJwt(undefined)).toBeNull();
    expect(decodeJwt(null)).toBeNull();
    expect(decodeJwt("")).toBeNull();
    expect(decodeJwt("only-one-part")).toBeNull();
    expect(decodeJwt("not.a.jwt.token.really")).toBeNull();
  });

  it("decodes a valid JWT payload", () => {
    const token = makeToken({ sub: "u1", role: "ORGANIZER", exp: 999 });
    const payload = decodeJwt(token);
    expect(payload).toMatchObject({ sub: "u1", role: "ORGANIZER", exp: 999 });
  });

  it("handles UTF-8 characters in payload", () => {
    const token = makeToken({ sub: "u1", name: "Áéíóú ção" });
    expect(decodeJwt(token)?.sub).toBe("u1");
  });
});

describe("isJwtExpired", () => {
  it("returns false when no exp", () => {
    expect(isJwtExpired({ sub: "u1" })).toBe(false);
  });

  it("returns true when exp is past", () => {
    expect(isJwtExpired({ exp: 1 })).toBe(true);
  });

  it("returns false when exp is in the future", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    expect(isJwtExpired({ exp: future })).toBe(false);
  });

  it("returns false for null payload", () => {
    expect(isJwtExpired(null)).toBe(false);
  });
});
