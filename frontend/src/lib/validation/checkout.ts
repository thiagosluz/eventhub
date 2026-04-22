import { z, ZodTypeAny } from "zod";
import type { FormField } from "@/types/event";

/**
 * Build a dynamic zod schema for the extra form fields of an event registration.
 * Each field becomes a `z.string()` (or boolean for CHECKBOX), optionally required.
 */
export function buildDynamicFormSchema(fields: FormField[]) {
  const shape: Record<string, ZodTypeAny> = {};

  for (const field of fields) {
    const key = field.id;
    switch (field.type) {
      case "CHECKBOX": {
        const base = z.enum(["true", "false"]);
        shape[key] = field.required
          ? base.refine((v) => v === "true", {
              message: "Confirme este campo para prosseguir",
            })
          : base.optional().or(z.literal(""));
        break;
      }
      case "NUMBER": {
        const base = z
          .string()
          .trim()
          .regex(/^-?\d+(\.\d+)?$/, "Informe um número válido");
        shape[key] = field.required
          ? base.min(1, "Este campo é obrigatório")
          : base.optional().or(z.literal(""));
        break;
      }
      case "EMAIL": {
        const base = z.string().trim().email("E-mail inválido");
        shape[key] = field.required
          ? base.min(1, "Este campo é obrigatório")
          : base.optional().or(z.literal(""));
        break;
      }
      case "MULTISELECT":
      case "SELECT":
      case "DATE":
      case "TEXTAREA":
      default: {
        const base = z.string();
        shape[key] = field.required
          ? base.trim().min(1, "Este campo é obrigatório")
          : base.optional().or(z.literal(""));
        break;
      }
    }
  }

  return z.object(shape);
}
