import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().max(80).optional().nullable(),
  bio: z.string().trim().max(500).optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
