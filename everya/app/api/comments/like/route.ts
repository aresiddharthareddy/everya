import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { commentId } = await req.json();
  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId, userId: session.user.id } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.commentLike.delete({ where: { id: existing.id } }),
      prisma.comment.update({ where: { id: commentId }, data: { likeCount: { decrement: 1 } } }),
    ]);
    return NextResponse.json({ liked: false });
  }

  await prisma.$transaction([
    prisma.commentLike.create({ data: { commentId, userId: session.user.id } }),
    prisma.comment.update({ where: { id: commentId }, data: { likeCount: { increment: 1 } } }),
  ]);
  return NextResponse.json({ liked: true });
}
