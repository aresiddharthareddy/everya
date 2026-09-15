import { prisma } from "@/lib/prisma";
import { calcReadingMinutes } from "@/lib/utils";
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

export async function autosaveDocument(
  documentId: string,
  userId: string,
  data: { title?: string; content?: string }
) {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, authorId: userId },
  });
  if (!doc) return null;

  const content = data.content ?? doc.content;
  return prisma.document.update({
    where: { id: documentId },
    data: {
      title: data.title ?? doc.title,
      content,
      excerpt: content.slice(0, 200).replace(/[#*`\n]/g, " ").trim(),
      readingMinutes: calcReadingMinutes(content),
    },
  });
}
