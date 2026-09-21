import { z } from "zod";

export const createRepositorySchema = z.object({
  name: z.string().trim().min(1, "Name required").max(120),
  description: z.string().trim().max(500).optional().nullable(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "ENTERPRISE"]).optional(),
});

export type CreateRepositoryInput = z.infer<typeof createRepositorySchema>;
