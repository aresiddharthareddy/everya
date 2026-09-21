import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertDocumentAccessible } from "@/lib/permissions/document";
import { unauthorized, notFound, jsonData, tooManyRequests } from "@/lib/api-response";
import { clientRateLimitKey, rateLimit } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const limit = rateLimit({
    key: clientRateLimitKey(req, `bookmark:${session.user.id}`),
    limit: 60,
    windowMs: 60_000,
  });
  if (!limit.ok) return tooManyRequests();

  const { id: documentId } = await params;
  const doc = await assertDocumentAccessible(documentId, session.user.id);
  if (!doc) return notFound();

  const existing = await prisma.bookmark.findUnique({
    where: { documentId_userId: { documentId, userId: session.user.id } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return jsonData({ bookmarked: false });
  }

  await prisma.bookmark.create({ data: { documentId, userId: session.user.id } });
  return jsonData({ bookmarked: true });
}
