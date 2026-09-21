import { z } from "zod";

export const createPublicationSchema = z.object({
  name: z.string().trim().min(1).max(100),
  handle: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Handle: lowercase letters, numbers, hyphens only"),
  description: z.string().trim().max(1000).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
});

export const updatePublicationSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  logo: z.string().url().optional().nullable(),
  coverImage: z.string().url().optional().nullable(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
});

export const publicationMemberSchema = z.object({
  username: z.string().trim().min(1),
  role: z.enum(["ADMIN", "EDITOR", "WRITER", "CONTRIBUTOR"]),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "EDITOR", "WRITER", "CONTRIBUTOR"]),
});
