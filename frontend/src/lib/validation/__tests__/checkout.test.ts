import { describe, it, expect } from "vitest";
import type { FormField } from "@/types/event";
import { buildDynamicFormSchema } from "../checkout";

function field(
  id: string,
  type: string,
  required = false,
  options: string[] = [],
): FormField {
  return { id, label: id, type, required, order: 0, options };
}

describe("buildDynamicFormSchema", () => {
  it("accepts when all required fields are filled", () => {
    const schema = buildDynamicFormSchema([
      field("f1", "TEXT", true),
      field("f2", "EMAIL", true),
      field("f3", "NUMBER", true),
      field("f4", "CHECKBOX", true),
    ]);
    const result = schema.safeParse({
      f1: "algum valor",
      f2: "user@example.com",
      f3: "42",
      f4: "true",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when required text is empty", () => {
    const schema = buildDynamicFormSchema([field("f1", "TEXT", true)]);
    const result = schema.safeParse({ f1: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const schema = buildDynamicFormSchema([field("email", "EMAIL", true)]);
    const result = schema.safeParse({ email: "not-email" });
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric value on NUMBER", () => {
    const schema = buildDynamicFormSchema([field("age", "NUMBER", true)]);
    const result = schema.safeParse({ age: "abc" });
    expect(result.success).toBe(false);
  });

  it("requires checkbox to be checked when required", () => {
    const schema = buildDynamicFormSchema([field("ack", "CHECKBOX", true)]);
    const result = schema.safeParse({ ack: "false" });
    expect(result.success).toBe(false);
  });

  it("allows optional fields to be empty", () => {
    const schema = buildDynamicFormSchema([
      field("bio", "TEXTAREA", false),
      field("extra", "SELECT", false, ["a", "b"]),
    ]);
    const result = schema.safeParse({ bio: "", extra: "" });
    expect(result.success).toBe(true);
  });
});
