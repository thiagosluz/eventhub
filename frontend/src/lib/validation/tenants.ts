import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .max(500, "URL muito longa")
  .refine((v) => !v || /^https?:\/\//i.test(v), {
    message: "Use uma URL válida (iniciando com http:// ou https://)",
  });

/**
 * Schema para `PATCH /tenants/me` — atualização de perfil público da organização.
 */
export const updateTenantSchema = z.object({
  bio: z.string().trim().max(2000, "Descrição muito longa"),
  websiteUrl: optionalUrl,
  instagramUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  twitterUrl: optionalUrl,
  coverUrl: z.string(),
});
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
