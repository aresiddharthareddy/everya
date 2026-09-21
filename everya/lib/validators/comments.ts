import { z } from "zod";

export const createCommentSchema = z.object({
  documentId: z.string().min(1),
  content: z.string().trim().min(1, "Comment cannot be empty").max(10_000),
  parentId: z.string().optional().nullable(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
