import { z } from "zod";

/**
 * Schema para cadastro de novo organizador pela equipe do tenant
 * (`POST /staff/organizers` via `staffService.createOrganizer`).
 */
export const createOrganizerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe o nome completo")
    .max(120, "Nome muito longo"),
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail")
    .email("E-mail inválido"),
  temporaryPassword: z
    .string()
    .min(6, "A senha temporária deve ter pelo menos 6 caracteres")
    .max(80, "Senha muito longa"),
});
export type CreateOrganizerInput = z.infer<typeof createOrganizerSchema>;
