import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import {
  ChangeForcedPasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterOrganizerDto,
  RegisterParticipantDto,
  ResetPasswordDto,
} from "./auth.dto";

async function errorsFor<T extends object>(Dto: new () => T, payload: unknown) {
  const instance = plainToInstance(Dto, payload);
  return validate(instance as object);
}

describe("Auth DTOs", () => {
  describe("LoginDto", () => {
    it("accepts a valid payload", async () => {
      const errors = await errorsFor(LoginDto, {
        email: "a@b.com",
        password: "abcdef",
      });
      expect(errors).toHaveLength(0);
    });

    it("rejects invalid email", async () => {
      const errors = await errorsFor(LoginDto, {
        email: "not-email",
        password: "abcdef",
      });
      expect(errors.map((e) => e.property)).toContain("email");
    });

    it("rejects empty password", async () => {
      const errors = await errorsFor(LoginDto, {
        email: "a@b.com",
        password: "",
      });
      expect(errors.map((e) => e.property)).toContain("password");
    });
  });

  describe("RegisterOrganizerDto", () => {
    const base = {
      tenantName: "Tenant",
      tenantSlug: "my-tenant",
      name: "Name",
      email: "a@b.com",
      password: "password123",
    };

    it("accepts valid input", async () => {
      expect(await errorsFor(RegisterOrganizerDto, base)).toHaveLength(0);
    });

    it("rejects short password", async () => {
      const errors = await errorsFor(RegisterOrganizerDto, {
        ...base,
        password: "short",
      });
      expect(errors.map((e) => e.property)).toContain("password");
    });

    it("rejects invalid tenant slug", async () => {
      const errors = await errorsFor(RegisterOrganizerDto, {
        ...base,
        tenantSlug: "Invalid Slug!",
      });
      expect(errors.map((e) => e.property)).toContain("tenantSlug");
    });
  });

  describe("RegisterParticipantDto", () => {
    it("rejects empty name", async () => {
      const errors = await errorsFor(RegisterParticipantDto, {
        name: "",
        email: "a@b.com",
        password: "password123",
      });
      expect(errors.map((e) => e.property)).toContain("name");
    });
  });

  describe("RefreshTokenDto", () => {
    it("rejects empty token", async () => {
      const errors = await errorsFor(RefreshTokenDto, { refresh_token: "" });
      expect(errors.map((e) => e.property)).toContain("refresh_token");
    });
  });

  describe("ForgotPasswordDto", () => {
    it("rejects invalid email", async () => {
      const errors = await errorsFor(ForgotPasswordDto, { email: "nope" });
      expect(errors.map((e) => e.property)).toContain("email");
    });
  });

  describe("ResetPasswordDto", () => {
    it("rejects short new password", async () => {
      const errors = await errorsFor(ResetPasswordDto, {
        token: "abc",
        newPassword: "short",
      });
      expect(errors.map((e) => e.property)).toContain("newPassword");
    });
  });

  describe("ChangeForcedPasswordDto", () => {
    it("rejects short password", async () => {
      const errors = await errorsFor(ChangeForcedPasswordDto, {
        newPassword: "123",
      });
      expect(errors.map((e) => e.property)).toContain("newPassword");
    });
  });
});
