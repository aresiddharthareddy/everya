import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertCanViewTrace } from "@/services/traces";
import { getMemberRole } from "@/services/publications";
import { canEditTraceContent, getTraceRole } from "@/lib/permissions/trace";
import { getDocumentContributors } from "@/services/collaboration";
import { notFound, forbidden, jsonData } from "@/lib/api-response";
import { getServerSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession();

  const doc = await prisma.document.findUnique({
    where: { id },
    select: {
      status: true,
      publicationId: true,
      repository: {
        select: {
          id: true,
          visibility: true,
          ownerId: true,
          publication: { select: { visibility: true } },
        },
      },
    },
  });
  if (!doc) return notFound();

  if (doc.publicationId) {
    const pubVis = doc.repository.publication?.visibility ?? "PUBLIC";
    if (pubVis === "PRIVATE" && doc.status === "DRAFT") {
      if (!session) return forbidden();
      const role = await getMemberRole(doc.publicationId, session.user.id);
      if (!role) return forbidden();
    }
  } else if (!(await assertCanViewTrace(doc.repository, session?.user.id))) {
    return forbidden();
  } else if (doc.status === "DRAFT") {
    if (!session) return forbidden();
    const role = await getTraceRole(doc.repository.id, session.user.id);
    if (!role || !canEditTraceContent(role)) return forbidden();
  }

  const contributors = await getDocumentContributors(id);
  if (!contributors) return notFound();

  return jsonData(contributors);
}
