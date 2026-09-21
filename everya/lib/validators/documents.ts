import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(200),
  content: z.string().max(500_000).optional(),
  repoSlug: z.string().trim().min(1, "Repository slug required"),
});

export const updateDocumentSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  subtitle: z.string().trim().max(300).optional().nullable(),
  content: z.string().max(500_000).optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
