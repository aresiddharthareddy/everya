import { z } from "zod";

export const traceMemberSchema = z.object({
  username: z.string().trim().min(1),
  role: z.enum(["EDITOR", "CONTRIBUTOR"]),
});

export const updateTraceMemberRoleSchema = z.object({
  role: z.enum(["EDITOR", "CONTRIBUTOR"]),
});

export const documentLinkSchema = z.object({
  toDocumentId: z.string().min(1),
  type: z.enum(["RELATED", "PREVIOUS", "NEXT", "PART_OF"]),
});
