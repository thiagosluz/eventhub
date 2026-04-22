export type JwtPayload = {
  sub?: string;
  email?: string;
  role?: string;
  tenantId?: string | null;
  exp?: number;
  mustChangePassword?: boolean;
};

function base64UrlDecode(input: string): string {
  const padLen = (4 - (input.length % 4)) % 4;
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLen);
  if (typeof atob === "function") {
    const binary = atob(padded);
    try {
      return decodeURIComponent(
        binary
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
    } catch {
      return binary;
    }
  }
  return Buffer.from(padded, "base64").toString("utf-8");
}

/**
 * Decodes a JWT payload WITHOUT verifying the signature.
 * Intended for lightweight proxy checks (role routing, expiration).
 * Never trust this for authorization of sensitive actions — the backend
 * re-verifies every call with the real secret.
 */
export function decodeJwt(token: string | undefined | null): JwtPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const json = base64UrlDecode(parts[1]);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isJwtExpired(payload: JwtPayload | null, skewSeconds = 0): boolean {
  if (!payload?.exp) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSec - skewSeconds;
}
