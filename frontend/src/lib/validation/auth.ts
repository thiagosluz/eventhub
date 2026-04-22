import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail")
    .email("E-mail inválido"),
  password: z
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerParticipantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo")
    .max(120, "Nome muito longo"),
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail")
    .email("E-mail inválido"),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres"),
});
export type RegisterParticipantInput = z.infer<typeof registerParticipantSchema>;

export const registerOrganizerSchema = registerParticipantSchema.extend({
  tenantName: z
    .string()
    .trim()
    .min(2, "Informe o nome da organização")
    .max(120, "Nome muito longo"),
  tenantSlug: z
    .string()
    .trim()
    .min(2, "Slug muito curto")
    .max(80, "Slug muito longo")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use apenas letras minúsculas, números e hífens",
    ),
});
export type RegisterOrganizerInput = z.infer<typeof registerOrganizerSchema>;
