import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().max(80).optional().nullable(),
  bio: z.string().trim().max(500).optional().nullable(),
  website: z
    .string()
    .trim()
    .max(200)
    .optional()
    .nullable()
    .refine((v) => !v || /^https?:\/\/.+/i.test(v), "Website must be a valid http(s) URL"),
  image: z.string().url().optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
