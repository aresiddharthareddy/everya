import { prisma } from "@/lib/prisma";
import { canEditTraceContent, getTraceRole } from "@/lib/permissions/trace";
import { calcReadingMinutes } from "@/lib/utils";
import { snapshotDocumentAfterSave } from "@/services/document-revisions";
import type { DocStats } from "@/types";

export async function getDocumentStats(documentId: string): Promise<DocStats> {
  const [doc, ratings, likes] = await Promise.all([
    prisma.document.findUnique({
      where: { id: documentId },
      select: { readerCount: true, readingMinutesTotal: true, readingMinutes: true },
    }),
    prisma.rating.findMany({ where: { documentId }, select: { value: true } }),
    prisma.documentLike.count({ where: { documentId } }),
  ]);

  const avgRating =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + r.value, 0) / ratings.length
      : 0;

  return {
    avgRating,
    ratingCount: ratings.length,
    likeCount: likes,
    readerCount: doc?.readerCount ?? 0,
    readingMinutesTotal: doc?.readingMinutesTotal ?? 0,
    readingMinutes: doc?.readingMinutes ?? 5,
  };
}

export async function recordDocumentView(
  documentId: string,
  userId?: string,
  durationSeconds = 60
) {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recent = userId
    ? await prisma.documentView.findFirst({
        where: { documentId, userId, createdAt: { gte: since } },
      })
    : null;
  if (recent) return;

  await prisma.$transaction([
    prisma.documentView.create({
      data: { documentId, userId, durationSeconds },
    }),
    prisma.document.update({
      where: { id: documentId },
      data: {
        readerCount: { increment: 1 },
        readingMinutesTotal: { increment: Math.ceil(durationSeconds / 60) },
      },
    }),
  ]);
}

export async function publishTraceDocument(documentId: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { status: true, publicationId: true, repositoryId: true, publishedAt: true },
  });
  if (!doc || doc.publicationId || doc.status === "ARCHIVED") return null;

  const role = await getTraceRole(doc.repositoryId, userId);
  if (!role || !canEditTraceContent(role)) return null;

  return prisma.document.update({
    where: { id: documentId },
    data: { status: "PUBLISHED", publishedAt: doc.publishedAt ?? new Date() },
  });
}

export async function autosaveDocument(
  documentId: string,
  userId: string,
  data: { title?: string; content?: string }
) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      title: true,
      subtitle: true,
      excerpt: true,
      status: true,
      authorId: true,
      content: true,
      repositoryId: true,
      publicationId: true,
    },
  });
  if (!doc || doc.publicationId) return null;

  const role = await getTraceRole(doc.repositoryId, userId);
  const canEdit = doc.authorId === userId || (role && canEditTraceContent(role));
  if (!canEdit) return null;

  const content = data.content ?? doc.content;
  const before = {
    title: doc.title,
    subtitle: doc.subtitle,
    content: doc.content,
    excerpt: doc.excerpt,
    status: doc.status,
  };
  const updated = await prisma.document.update({
    where: { id: documentId },
    data: {
      title: data.title ?? doc.title,
      content,
      excerpt: content.slice(0, 200).replace(/[#*`\n]/g, " ").trim(),
      readingMinutes: calcReadingMinutes(content),
      lastEditedById: userId,
    },
  });
  await snapshotDocumentAfterSave(documentId, userId, before, {
    title: updated.title,
    subtitle: updated.subtitle,
    content: updated.content,
    excerpt: updated.excerpt,
    status: updated.status,
  });
  return updated;
}
