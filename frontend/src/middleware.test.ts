import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => {
  class FakeResponse {
    constructor(
      public type: "next" | "redirect",
      public url?: URL,
      public cookies = new Map<string, string>(),
    ) {}
    // Emulate NextResponse cookie API used by middleware.
    static next() {
      return new FakeResponse("next");
    }
    static redirect(url: URL) {
      return new FakeResponse("redirect", url);
    }
    get cookiesApi() {
      return {
        delete: (name: string) => this.cookies.set(`_deleted_${name}`, "1"),
      };
    }
  }
  return {
    NextResponse: {
      next: () => FakeResponse.next(),
      redirect: (url: URL) => FakeResponse.redirect(url),
    },
  };
});

import { middleware } from "./middleware";

function makeToken(payload: Record<string, unknown>): string {
  const b64 = (o: object) =>
    Buffer.from(JSON.stringify(o))
      .toString("base64")
      .replace(/=+$/, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  return `${b64({ alg: "HS256" })}.${b64(payload)}.sig`;
}

function mockReq(pathname: string, tokenPayload?: Record<string, unknown>) {
  const url = new URL(`http://localhost${pathname}`);
  const cookies = new Map<string, string>();
  if (tokenPayload) cookies.set("eventhub_token", makeToken(tokenPayload));
  return {
    nextUrl: {
      pathname,
      search: "",
      clone: () => new URL(url.toString()),
    },
    cookies: {
      get: (name: string) => {
        const v = cookies.get(name);
        return v ? { value: v } : undefined;
      },
    },
  } as unknown as Parameters<typeof middleware>[0];
}

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lets through unprotected paths", () => {
    const res = middleware(mockReq("/events"));
    expect((res as { type: string }).type).toBe("next");
  });

  it("redirects unauthenticated requests for /dashboard", () => {
    const res = middleware(mockReq("/dashboard")) as unknown as {
      type: string;
      url: URL;
    };
    expect(res.type).toBe("redirect");
    expect(res.url.pathname).toBe("/auth/login");
    expect(res.url.searchParams.get("reason")).toBe("unauthenticated");
    expect(res.url.searchParams.get("redirect")).toBe("/dashboard");
  });

  it("redirects expired tokens for /admin", () => {
    const res = middleware(
      mockReq("/admin/users", { role: "SUPER_ADMIN", exp: 1 }),
    ) as unknown as { type: string; url: URL };
    expect(res.type).toBe("redirect");
    expect(res.url.searchParams.get("reason")).toBe("expired");
  });

  it("redirects to / when role is not allowed", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const res = middleware(
      mockReq("/admin/users", { role: "PARTICIPANT", exp: future }),
    ) as unknown as { type: string; url: URL };
    expect(res.type).toBe("redirect");
    expect(res.url.pathname).toBe("/");
    expect(res.url.searchParams.get("reason")).toBe("forbidden");
  });

  it("lets a SUPER_ADMIN into /admin", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const res = middleware(
      mockReq("/admin/users", { role: "SUPER_ADMIN", exp: future }),
    ) as unknown as { type: string };
    expect(res.type).toBe("next");
  });

  it("lets an ORGANIZER into /dashboard", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const res = middleware(
      mockReq("/dashboard/events", { role: "ORGANIZER", exp: future }),
    ) as unknown as { type: string };
    expect(res.type).toBe("next");
  });
});
