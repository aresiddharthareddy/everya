import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { listDocumentRevisions } from "@/services/document-revisions";
import { unauthorized, notFound, jsonData } from "@/lib/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const { id } = await params;
  const revisions = await listDocumentRevisions(id, session.user.id);
  if (!revisions) return notFound();

  return jsonData({
    revisions: revisions.map((r) => ({
      id: r.id,
      revisionNumber: r.revisionNumber,
      title: r.title,
      status: r.status,
      createdAt: r.createdAt,
      createdBy: r.createdBy,
    })),
  });
}
