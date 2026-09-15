import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: documentId } = await params;
  const { value } = await req.json();
  if (!value || value < 1 || value > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { repository: { select: { slug: true, owner: { select: { username: true } } } } },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.rating.upsert({
    where: { documentId_userId: { documentId, userId: session.user.id } },
    create: { documentId, userId: session.user.id, value },
    update: { value },
  });

  await notify({
    userId: doc.authorId,
    actorId: session.user.id,
    type: "RATING",
    title: "New rating",
    message: `Your story “${doc.title}” was rated ${value}★`,
    link: `/r/${doc.repository.owner.username}/${doc.repository.slug}/${doc.slug}`,
  });

  return NextResponse.json({ ok: true });
}
