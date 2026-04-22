import { NextResponse, type NextRequest } from "next/server";
import { decodeJwt, isJwtExpired } from "@/lib/auth/jwt";

const AUTH_COOKIE = "eventhub_token";

type AllowedRoles = readonly string[];

interface ProtectedArea {
  match: (pathname: string) => boolean;
  allow: AllowedRoles;
  fallback: string;
}

const PROTECTED_AREAS: ProtectedArea[] = [
  {
    match: (p) => p.startsWith("/admin"),
    allow: ["SUPER_ADMIN"],
    fallback: "/auth/login",
  },
  {
    match: (p) => p.startsWith("/dashboard"),
    allow: ["ORGANIZER", "REVIEWER", "SUPER_ADMIN"],
    fallback: "/auth/login",
  },
  {
    match: (p) => p.startsWith("/speaker"),
    allow: ["SPEAKER", "SUPER_ADMIN"],
    fallback: "/auth/login",
  },
  {
    match: (p) => p.startsWith("/monitor"),
    allow: ["MONITOR", "ORGANIZER", "SUPER_ADMIN"],
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

export function middleware(req: NextRequest) {
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
    url.pathname = "/";
    url.searchParams.set("reason", "forbidden");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/speaker/:path*", "/monitor/:path*"],
};
