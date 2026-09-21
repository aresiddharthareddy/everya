import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewRepo } from "@/lib/access";
import { unauthorized, badRequest, notFound, jsonData, tooManyRequests } from "@/lib/api-response";
import { clientRateLimitKey, rateLimit } from "@/lib/rate-limit";

const likeSchema = z.object({
  commentId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const limit = rateLimit({
    key: clientRateLimitKey(req, `comment-like:${session.user.id}`),
    limit: 60,
    windowMs: 60_000,
  });
  if (!limit.ok) return tooManyRequests();

  const parsed = likeSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest("commentId required");

  const { commentId } = parsed.data;
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      document: {
        include: { repository: { select: { visibility: true, ownerId: true } } },
      },
    },
  });
  if (!comment || !canViewRepo(comment.document.repository, session.user.id)) {
    return notFound();
  }

  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId, userId: session.user.id } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.commentLike.delete({ where: { id: existing.id } }),
      prisma.comment.update({ where: { id: commentId }, data: { likeCount: { decrement: 1 } } }),
    ]);
    return jsonData({ liked: false });
  }

  await prisma.$transaction([
    prisma.commentLike.create({ data: { commentId, userId: session.user.id } }),
    prisma.comment.update({ where: { id: commentId }, data: { likeCount: { increment: 1 } } }),
  ]);
  return jsonData({ liked: true });
}
