import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId, content, parentId } = await req.json();
  if (!documentId || !content?.trim()) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { repository: { select: { slug: true, owner: { select: { username: true } } } } },
  });
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: {
      documentId,
      content: content.trim(),
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
    if (parent) {
      await notify({
        userId: parent.authorId,
        actorId: session.user.id,
        type: "REPLY",
        title: "New reply",
        message: `Someone replied to your comment on “${document.title}”`,
        link,
      });
    }
  } else {
    await notify({
      userId: document.authorId,
      actorId: session.user.id,
      type: "COMMENT",
      title: "New comment",
      message: `Someone commented on “${document.title}”`,
      link,
    });
  }

  return NextResponse.json({
    ...comment,
    createdAt: comment.createdAt.toISOString(),
    replies: [],
  });
}
