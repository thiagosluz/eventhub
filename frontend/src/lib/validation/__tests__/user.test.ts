import { describe, it, expect } from "vitest";
import {
  updateProfileSchema,
  changePasswordSchema,
  forcePasswordChangeSchema,
} from "../user";

describe("updateProfileSchema", () => {
  it("accepts a valid payload", () => {
    const result = updateProfileSchema.safeParse({
      name: "João Silva",
      email: "joao@example.com",
      bio: "",
      publicProfile: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects short name", () => {
    const result = updateProfileSchema.safeParse({
      name: "Jo",
      email: "joao@example.com",
      bio: "",
      publicProfile: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = updateProfileSchema.safeParse({
      name: "João Silva",
      email: "not-email",
      bio: "",
      publicProfile: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects oversized bio", () => {
    const result = updateProfileSchema.safeParse({
      name: "João Silva",
      email: "joao@example.com",
      bio: "x".repeat(501),
      publicProfile: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  const validBase = {
    currentPassword: "oldpassword",
    newPassword: "newpassword1",
    confirmPassword: "newpassword1",
  };

  it("accepts valid data", () => {
    const result = changePasswordSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("rejects short new password", () => {
    const result = changePasswordSchema.safeParse({
      ...validBase,
      newPassword: "abc",
      confirmPassword: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched confirmation", () => {
    const result = changePasswordSchema.safeParse({
      ...validBase,
      confirmPassword: "different1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const match = result.error.issues.some((i) =>
        i.path.includes("confirmPassword"),
      );
      expect(match).toBe(true);
    }
  });

  it("rejects when new password equals current", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "samepassword",
      newPassword: "samepassword",
      confirmPassword: "samepassword",
    });
    expect(result.success).toBe(false);
  });
});

describe("forcePasswordChangeSchema", () => {
  it("accepts matching strong password", () => {
    const result = forcePasswordChangeSchema.safeParse({
      password: "mynewpassword",
      confirmPassword: "mynewpassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when passwords do not match", () => {
    const result = forcePasswordChangeSchema.safeParse({
      password: "mynewpassword",
      confirmPassword: "another",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = forcePasswordChangeSchema.safeParse({
      password: "abc",
      confirmPassword: "abc",
    });
    expect(result.success).toBe(false);
  });
});
