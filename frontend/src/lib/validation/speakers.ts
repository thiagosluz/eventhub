import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .max(500, "URL muito longa")
  .refine((v) => !v || /^https?:\/\//i.test(v), {
    message: "Use uma URL válida (iniciando com http:// ou https://)",
  });

const optionalEmail = z
  .string()
  .trim()
  .max(160, "E-mail muito longo")
  .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: "E-mail inválido",
  });

export const speakerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe o nome completo")
    .max(120, "Nome muito longo"),
  email: optionalEmail,
  bio: z.string().trim().max(2000, "Biografia muito longa"),
  avatarUrl: z.string(),
  linkedinUrl: optionalUrl,
  websiteUrl: optionalUrl,
});
export type SpeakerInput = z.infer<typeof speakerSchema>;
