import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: documentId } = await params;
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { repository: { select: { slug: true, owner: { select: { username: true } } } } },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.documentLike.findUnique({
    where: { documentId_userId: { documentId, userId: session.user.id } },
  });

  if (existing) {
    await prisma.documentLike.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  }

  await prisma.documentLike.create({ data: { documentId, userId: session.user.id } });
  await notify({
    userId: doc.authorId,
    actorId: session.user.id,
    type: "LIKE",
    title: "New like",
    message: `Someone liked “${doc.title}”`,
    link: `/r/${doc.repository.owner.username}/${doc.repository.slug}/${doc.slug}`,
  });
  return NextResponse.json({ liked: true });
}
