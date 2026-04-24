import { z } from "zod";

export const activitySpeakerSchema = z.object({
  speakerId: z.string(),
  roleId: z.string(),
});
export type ActivitySpeakerInput = z.infer<typeof activitySpeakerSchema>;

export const activitySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "O título deve ter pelo menos 3 caracteres")
      .max(200, "Título muito longo"),
    description: z.string().trim().max(2000, "Descrição muito longa"),
    location: z.string().trim().max(200, "Local muito longo"),
    startAt: z.string().min(1, "Informe o início"),
    endAt: z.string().min(1, "Informe o término"),
    capacity: z
      .string()
      .refine(
        (v) => v === "" || (Number.isFinite(Number(v)) && Number(v) >= 0),
        { message: "Capacidade inválida" },
      ),
    typeId: z.string(),
    requiresEnrollment: z.boolean(),
    requiresConfirmation: z.boolean(),
    confirmationDays: z.number().int().min(1).max(30),
    speakers: z.array(activitySpeakerSchema),
  })
  .refine(
    (data) => {
      if (!data.startAt || !data.endAt) return true;
      return new Date(data.endAt) >= new Date(data.startAt);
    },
    {
      message: "O término deve ser igual ou posterior ao início",
      path: ["endAt"],
    },
  );
export type ActivityInput = z.infer<typeof activitySchema>;

export const quickCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos 2 caracteres")
    .max(80, "Nome muito longo"),
});
export type QuickCategoryInput = z.infer<typeof quickCategorySchema>;
