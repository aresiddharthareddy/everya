import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readingProgressSchema } from "@/lib/validators";
import { assertDocumentAccessible } from "@/lib/permissions/document";
import { unauthorized, badRequest, notFound, jsonData, tooManyRequests } from "@/lib/api-response";
import { clientRateLimitKey, rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const rows = await prisma.readingProgress.findMany({
    where: { userId: session.user.id, progress: { lt: 1 } },
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: {
      document: {
        include: {
          author: { select: { username: true, name: true } },
          publication: { select: { handle: true, name: true } },
          repository: { select: { slug: true, owner: { select: { username: true } } } },
        },
      },
    },
  });

  return jsonData(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const limit = rateLimit({
    key: clientRateLimitKey(req, `progress:${session.user.id}`),
    limit: 120,
    windowMs: 60_000,
  });
  if (!limit.ok) return tooManyRequests();

  const parsed = readingProgressSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid input");

  const doc = await assertDocumentAccessible(parsed.data.documentId, session.user.id);
  if (!doc) return notFound();

  const row = await prisma.readingProgress.upsert({
    where: {
      userId_documentId: { userId: session.user.id, documentId: parsed.data.documentId },
    },
    create: {
      userId: session.user.id,
      documentId: parsed.data.documentId,
      progress: parsed.data.progress,
    },
    update: { progress: parsed.data.progress },
  });

  return jsonData(row);
}
