import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => {
  class FakeHeaders {
    private store = new Map<string, string>();
    set(k: string, v: string) {
      this.store.set(k.toLowerCase(), v);
    }
    get(k: string) {
      return this.store.get(k.toLowerCase()) ?? null;
    }
  }
  class FakeResponse {
    headers = new FakeHeaders();
    constructor(
      public type: "next" | "redirect",
      public url?: URL,
      public cookies = new Map<string, string>(),
    ) {}
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

import { proxy } from "./proxy";

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
  } as unknown as Parameters<typeof proxy>[0];
}

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lets through unprotected paths", () => {
    const res = proxy(mockReq("/events"));
    expect((res as { type: string }).type).toBe("next");
  });

  it("redirects unauthenticated requests for /dashboard", () => {
    const res = proxy(mockReq("/dashboard")) as unknown as {
      type: string;
      url: URL;
    };
    expect(res.type).toBe("redirect");
    expect(res.url.pathname).toBe("/auth/login");
    expect(res.url.searchParams.get("reason")).toBe("unauthenticated");
    expect(res.url.searchParams.get("redirect")).toBe("/dashboard");
  });

  it("redirects expired tokens for /admin", () => {
    const res = proxy(
      mockReq("/admin/users", { role: "SUPER_ADMIN", exp: 1 }),
    ) as unknown as { type: string; url: URL };
    expect(res.type).toBe("redirect");
    expect(res.url.searchParams.get("reason")).toBe("expired");
  });

  it("redirects forbidden role to its own role home", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const res = proxy(
      mockReq("/admin/users", { role: "PARTICIPANT", exp: future }),
    ) as unknown as { type: string; url: URL };
    expect(res.type).toBe("redirect");
    expect(res.url.pathname).toBe("/profile");
    expect(res.url.searchParams.get("reason")).toBe("forbidden");
  });

  it("redirects to / when token has no role at all", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const res = proxy(
      mockReq("/monitor/events", { exp: future }),
    ) as unknown as { type: string; url: URL };
    expect(res.type).toBe("redirect");
    expect(res.url.pathname).toBe("/");
    expect(res.url.searchParams.get("reason")).toBe("forbidden");
  });

  it("lets a SUPER_ADMIN into /admin", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const res = proxy(
      mockReq("/admin/users", { role: "SUPER_ADMIN", exp: future }),
    ) as unknown as { type: string };
    expect(res.type).toBe("next");
  });

  it("lets an ORGANIZER into /dashboard", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const res = proxy(
      mockReq("/dashboard/events", { role: "ORGANIZER", exp: future }),
    ) as unknown as { type: string };
    expect(res.type).toBe("next");
  });

  it("lets a SPEAKER into /speaker", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const res = proxy(
      mockReq("/speaker/activities", { role: "SPEAKER", exp: future }),
    ) as unknown as { type: string };
    expect(res.type).toBe("next");
  });

  it("lets a PARTICIPANT into /monitor (monitors são PARTICIPANTs promovidos por evento)", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const res = proxy(
      mockReq("/monitor/events", { role: "PARTICIPANT", exp: future }),
    ) as unknown as { type: string };
    expect(res.type).toBe("next");
  });

  it.each(["SPEAKER", "REVIEWER", "ORGANIZER", "SUPER_ADMIN"])(
    "lets a %s into /monitor (autorização real por evento é no backend)",
    (role) => {
      const future = Math.floor(Date.now() / 1000) + 3600;
      const res = proxy(
        mockReq("/monitor/events", { role, exp: future }),
      ) as unknown as { type: string };
      expect(res.type).toBe("next");
    },
  );

  it("blocks SUPER_ADMIN from /dashboard redirecting to admin home", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const res = proxy(
      mockReq("/dashboard", { role: "SUPER_ADMIN", exp: future }),
    ) as unknown as { type: string; url: URL };
    expect(res.type).toBe("redirect");
    expect(res.url.pathname).toBe("/admin/dashboard");
    expect(res.url.searchParams.get("reason")).toBe("forbidden");
  });

  it("blocks PARTICIPANT from /dashboard redirecting to /profile", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const res = proxy(
      mockReq("/dashboard", { role: "PARTICIPANT", exp: future }),
    ) as unknown as { type: string; url: URL };
    expect(res.type).toBe("redirect");
    expect(res.url.pathname).toBe("/profile");
    expect(res.url.searchParams.get("reason")).toBe("forbidden");
  });
});
