import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getTraceByPath } from "@/services/traces";
import { addTraceLink, removeTraceLink } from "@/services/knowledge";
import { unauthorized, badRequest, notFound, forbidden, jsonData } from "@/lib/api-response";

const createSchema = z.object({
  toUsername: z.string().min(1),
  toSlug: z.string().min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string; slug: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const { username, slug } = await params;
  const from = await getTraceByPath(username, slug);
  if (!from) return notFound();

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid input");

  const to = await getTraceByPath(parsed.data.toUsername, parsed.data.toSlug);
  if (!to) return badRequest("Target trace not found");

  const result = await addTraceLink(from.id, to.id, session.user.id);
  if (result.error === "forbidden") return forbidden();
  if (result.error === "invalid") return badRequest("Invalid trace link");
  return jsonData(result.link, 201);
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const { linkId } = await req.json();
  if (!linkId) return badRequest("linkId required");

  const result = await removeTraceLink(String(linkId), session.user.id);
  if (result.error === "not_found") return notFound();
  if (result.error === "forbidden") return forbidden();
  return jsonData({ ok: true });
}
