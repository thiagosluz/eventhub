import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerOrganizerSchema,
  registerParticipantSchema,
} from "../auth";

describe("loginSchema", () => {
  it("accepts valid input", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "123",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerParticipantSchema", () => {
  it("requires name, email, strong password", () => {
    const invalid = registerParticipantSchema.safeParse({
      name: "ab",
      email: "nope",
      password: "short",
    });
    expect(invalid.success).toBe(false);
  });

  it("accepts valid participant payload", () => {
    const ok = registerParticipantSchema.safeParse({
      name: "João Silva",
      email: "joao@example.com",
      password: "password123",
    });
    expect(ok.success).toBe(true);
  });
});

describe("registerOrganizerSchema", () => {
  it("rejects invalid slug characters", () => {
    const result = registerOrganizerSchema.safeParse({
      name: "João",
      email: "joao@example.com",
      password: "password123",
      tenantName: "Tech Events",
      tenantSlug: "Tech Events!",
    });
    expect(result.success).toBe(false);
  });

  it("accepts kebab-case slug", () => {
    const result = registerOrganizerSchema.safeParse({
      name: "João Silva",
      email: "joao@example.com",
      password: "password123",
      tenantName: "Tech Events",
      tenantSlug: "tech-events-2026",
    });
    expect(result.success).toBe(true);
  });
});
