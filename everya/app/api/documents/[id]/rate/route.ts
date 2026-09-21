import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { assertDocumentAccessible } from "@/lib/permissions/document";
import { unauthorized, badRequest, notFound, jsonData, tooManyRequests } from "@/lib/api-response";
import { clientRateLimitKey, rateLimit } from "@/lib/rate-limit";

const rateSchema = z.object({
  value: z.number().int().min(1).max(5),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const limit = rateLimit({
    key: clientRateLimitKey(req, `rate:${session.user.id}`),
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.ok) return tooManyRequests();

  const { id: documentId } = await params;
  const parsed = rateSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest("Rating must be 1–5");

  const doc = await assertDocumentAccessible(documentId, session.user.id);
  if (!doc) return notFound();

  const { value } = parsed.data;
  await prisma.rating.upsert({
    where: { documentId_userId: { documentId, userId: session.user.id } },
    create: { documentId, userId: session.user.id, value },
    update: { value },
  });

  if (doc.authorId !== session.user.id) {
    await notify({
      userId: doc.authorId,
      actorId: session.user.id,
      type: "RATING",
      title: "New rating",
      message: `Your story “${doc.title}” was rated ${value}★`,
      link: `/r/${doc.repository.owner.username}/${doc.repository.slug}/${doc.slug}`,
    });
  }

  return jsonData({ ok: true });
}
