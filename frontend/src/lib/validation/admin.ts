import { z } from "zod";

/**
 * Schemas para operações do Super Admin (`/admin/**`).
 */

export const adminCreateTenantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome da organização")
    .max(120, "Nome muito longo"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug muito curto")
    .max(80, "Slug muito longo")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use apenas letras minúsculas, números e hífens",
    ),
  adminName: z
    .string()
    .trim()
    .min(3, "Informe o nome do administrador")
    .max(120, "Nome muito longo"),
  adminEmail: z
    .string()
    .trim()
    .min(1, "Informe um e-mail")
    .email("E-mail inválido"),
  adminPassword: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres"),
});
export type AdminCreateTenantInput = z.infer<typeof adminCreateTenantSchema>;

export const adminEditUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe o nome completo")
    .max(120, "Nome muito longo"),
  email: z
    .string()
    .trim()
    .min(1, "Informe um e-mail")
    .email("E-mail inválido"),
  role: z.enum([
    "PARTICIPANT",
    "SPEAKER",
    "REVIEWER",
    "ORGANIZER",
    "SUPER_ADMIN",
  ]),
});
export type AdminEditUserInput = z.infer<typeof adminEditUserSchema>;
