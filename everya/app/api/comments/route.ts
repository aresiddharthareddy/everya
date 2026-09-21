import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { createCommentSchema } from "@/lib/validators";
import {
  assertDocumentAccessible,
  commentParentMatchesDocument,
} from "@/lib/permissions/document";
import { unauthorized, badRequest, notFound, jsonData, tooManyRequests } from "@/lib/api-response";
import { clientRateLimitKey, rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const limit = rateLimit({
    key: clientRateLimitKey(req, `comment:${session.user.id}`),
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.ok) return tooManyRequests();

  const parsed = createCommentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message || "Invalid input", parsed.error.flatten());
  }

  const { documentId, content, parentId } = parsed.data;
  const document = await assertDocumentAccessible(documentId, session.user.id);
  if (!document) return notFound();

  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!commentParentMatchesDocument(parent, documentId)) {
      return badRequest("Parent comment does not belong to this document");
    }
  }

  const comment = await prisma.comment.create({
    data: {
      documentId,
      content,
      authorId: session.user.id,
      parentId: parentId || null,
    },
    include: {
      author: { select: { id: true, username: true, name: true, image: true } },
    },
  });

  const link = `/r/${document.repository.owner.username}/${document.repository.slug}/${document.slug}`;
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (parent && parent.authorId !== session.user.id) {
      await notify({
        userId: parent.authorId,
        actorId: session.user.id,
        type: "REPLY",
        title: "New reply",
        message: `Someone replied to your comment on “${document.title}”`,
        link,
      });
    }
  } else if (document.authorId !== session.user.id) {
    await notify({
      userId: document.authorId,
      actorId: session.user.id,
      type: "COMMENT",
      title: "New comment",
      message: `Someone commented on “${document.title}”`,
      link,
    });
  }

  return jsonData({
    ...comment,
    createdAt: comment.createdAt.toISOString(),
    replies: [],
  });
}
