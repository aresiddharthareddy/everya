import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { updateArticle } from "@/services/articles";
import { autosaveDocument } from "@/services/documents";
import { deleteDraftDocument } from "@/services/drafts";
import { updateDocumentSchema } from "@/lib/validators";
import { unauthorized, badRequest, notFound, forbidden, jsonData, tooManyRequests } from "@/lib/api-response";
import { clientRateLimitKey, rateLimit } from "@/lib/rate-limit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const limit = rateLimit({
    key: clientRateLimitKey(req, `autosave:${session.user.id}`),
    limit: 120,
    windowMs: 60_000,
  });
  if (!limit.ok) return tooManyRequests();

  const { id } = await params;
  const parsed = updateDocumentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message || "Invalid input", parsed.error.flatten());
  }

  const doc =
    (await updateArticle(id, session.user.id, parsed.data)) ??
    (await autosaveDocument(id, session.user.id, parsed.data));
  if (!doc) return notFound();
  return jsonData(doc);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const { id } = await params;
  const result = await deleteDraftDocument(id, session.user.id);
  if (!result) return forbidden("Only drafts you can edit may be deleted");
  return jsonData({ ok: true });
}
