import { z } from "zod";

export const MAX_SUBMISSION_FILE_BYTES = 10 * 1024 * 1024;

export const submissionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Título muito curto")
    .max(200, "Título muito longo"),
  abstract: z
    .string()
    .trim()
    .min(20, "O resumo deve ter pelo menos 20 caracteres")
    .max(4000, "Resumo muito longo"),
  modalityId: z.string().trim().optional().or(z.literal("")),
  thematicAreaId: z.string().trim().optional().or(z.literal("")),
  file: z
    .custom<File | null>(
      (value) => value instanceof File,
      { message: "Selecione um arquivo PDF" },
    )
    .refine(
      (value) => value instanceof File && value.type === "application/pdf",
      { message: "O arquivo deve ser um PDF" },
    )
    .refine(
      (value) => value instanceof File && value.size <= MAX_SUBMISSION_FILE_BYTES,
      { message: "O arquivo deve ter no máximo 10MB" },
    ),
});
export type SubmissionInput = z.infer<typeof submissionSchema>;
