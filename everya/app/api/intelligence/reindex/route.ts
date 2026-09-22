import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTraceRole } from "@/lib/permissions/trace";
import { canEditTraceContent } from "@/lib/permissions/trace";
import { getMemberRole } from "@/services/publications";
import { canEditArticle } from "@/lib/permissions/publication";
import { indexDocument } from "@/services/indexing";
import { unauthorized, badRequest, notFound, forbidden, jsonData, tooManyRequests } from "@/lib/api-response";
import { clientRateLimitKey, rateLimit } from "@/lib/rate-limit";

const schema = z.object({ documentId: z.string() });

async function canReindexDocument(documentId: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { authorId: true, publicationId: true, repositoryId: true },
  });
  if (!doc) return false;
  if (doc.authorId === userId) return true;
  if (doc.publicationId) {
    const role = await getMemberRole(doc.publicationId, userId);
    return role ? canEditArticle(role) : false;
  }
  const role = await getTraceRole(doc.repositoryId, userId);
  return role ? canEditTraceContent(role) : false;
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const limit = rateLimit({
    key: clientRateLimitKey(req, `reindex:${session.user.id}`),
    limit: 10,
    windowMs: 60_000,
  });
  if (!limit.ok) return tooManyRequests();

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return badRequest("documentId required");

  if (!(await canReindexDocument(parsed.data.documentId, session.user.id))) {
    return forbidden();
  }

  const result = await indexDocument(parsed.data.documentId);
  if (result.reason === "not_found") return notFound();
  return jsonData(result);
}
