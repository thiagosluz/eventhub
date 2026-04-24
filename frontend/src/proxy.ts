import { NextResponse, type NextRequest } from "next/server";
import { decodeJwt, isJwtExpired } from "@/lib/auth/jwt";
import { AREA_ROLES, ROLE_HOME, type AreaKey } from "@/lib/auth/roles";

const AUTH_COOKIE = "eventhub_token";

interface ProtectedArea {
  key: AreaKey;
  match: (pathname: string) => boolean;
  allow: readonly string[];
  fallback: string;
}

const PROTECTED_AREAS: ProtectedArea[] = [
  {
    key: "admin",
    match: (p) => p.startsWith("/admin"),
    allow: AREA_ROLES.admin,
    fallback: "/auth/login",
  },
  {
    key: "dashboard",
    match: (p) => p.startsWith("/dashboard"),
    allow: AREA_ROLES.dashboard,
    fallback: "/auth/login",
  },
  {
    key: "speaker",
    match: (p) => p.startsWith("/speaker"),
    allow: AREA_ROLES.speaker,
    fallback: "/auth/login",
  },
  {
    key: "monitor",
    match: (p) => p.startsWith("/monitor"),
    allow: AREA_ROLES.monitor,
    fallback: "/auth/login",
  },
];

function redirectToLogin(req: NextRequest, reason?: string): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = "/auth/login";
  url.searchParams.set("redirect", req.nextUrl.pathname + req.nextUrl.search);
  if (reason) url.searchParams.set("reason", reason);
  const response = NextResponse.redirect(url);
  if (reason === "expired" || reason === "invalid") {
    response.cookies.delete(AUTH_COOKIE);
  }
  return response;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const area = PROTECTED_AREAS.find((a) => a.match(pathname));
  if (!area) return NextResponse.next();

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return redirectToLogin(req, "unauthenticated");

  const payload = decodeJwt(token);
  if (!payload) return redirectToLogin(req, "invalid");
  if (isJwtExpired(payload)) return redirectToLogin(req, "expired");

  const role = payload.role;
  if (!role || !area.allow.includes(role)) {
    const url = req.nextUrl.clone();
    url.pathname = role && ROLE_HOME[role as keyof typeof ROLE_HOME]
      ? ROLE_HOME[role as keyof typeof ROLE_HOME]
      : "/";
    url.search = "";
    url.searchParams.set("reason", "forbidden");

    const response = NextResponse.redirect(url);
    if (process.env.NODE_ENV !== "production") {
      response.headers.set("x-eh-forbidden-role", String(role ?? "<none>"));
      response.headers.set("x-eh-forbidden-area", area.key);
      response.headers.set("x-eh-forbidden-allow", area.allow.join(","));
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/speaker/:path*", "/monitor/:path*"],
};
