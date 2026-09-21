import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { restoreDocumentRevision } from "@/services/document-revisions";
import { unauthorized, notFound, jsonData } from "@/lib/api-response";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; revisionId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const { id, revisionId } = await params;
  const doc = await restoreDocumentRevision(id, revisionId, session.user.id);
  if (!doc) return notFound();

  return jsonData(doc);
}
