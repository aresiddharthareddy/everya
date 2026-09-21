import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { upsertCreatorProfile } from "@/services/creator";
import { unauthorized, badRequest, jsonData } from "@/lib/api-response";
import { z } from "zod";

const schema = z.object({
  tagline: z.string().max(200).nullable().optional(),
  links: z.array(z.object({ label: z.string(), url: z.string().url() })).optional(),
  isCreator: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid input");

  const profile = await upsertCreatorProfile(session.user.id, parsed.data);
  return jsonData(profile);
}
