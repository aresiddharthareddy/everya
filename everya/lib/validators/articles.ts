import { z } from "zod";

export const createArticleSchema = z.object({
  title: z.string().trim().min(1).max(200),
  subtitle: z.string().trim().max(300).optional(),
  content: z.string().max(500_000).optional(),
  publicationHandle: z.string().trim().min(1),
  coverImage: z.string().url().optional(),
});

export const updateArticleSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  subtitle: z.string().trim().max(300).optional().nullable(),
  content: z.string().max(500_000).optional(),
  coverImage: z.string().url().optional().nullable(),
});

export const readingProgressSchema = z.object({
  documentId: z.string().min(1),
  progress: z.number().min(0).max(1),
});

export const reportSchema = z.object({
  targetType: z.enum(["document", "comment", "user"]),
  targetId: z.string().min(1),
  reason: z.string().trim().min(3).max(500),
});
