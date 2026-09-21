import { prisma } from "@/lib/prisma";
import { calcReadingMinutes, slugify } from "@/lib/utils";
import { getMemberRole } from "./publications";
import { canEditArticle, canPublishArticle } from "@/lib/permissions/publication";
import { trackEvent } from "./analytics";

export async function createArticleDraft(
  userId: string,
  data: { title: string; subtitle?: string; content?: string; publicationHandle: string; coverImage?: string }
) {
  const publication = await prisma.publication.findUnique({
    where: { handle: data.publicationHandle },
    include: { repository: true },
  });
  if (!publication) return null;

  const role = await getMemberRole(publication.id, userId);
  if (!role || !canPublishArticle(role)) return null;

  const baseSlug = slugify(data.title);
  let slug = baseSlug;
  let n = 1;
  while (await prisma.document.findUnique({ where: { repositoryId_slug: { repositoryId: publication.repositoryId, slug } } })) {
    slug = `${baseSlug}-${n++}`;
  }

  const content = data.content ?? "";
  return prisma.document.create({
    data: {
      title: data.title,
      subtitle: data.subtitle,
      slug,
      content,
      coverImage: data.coverImage,
      status: "DRAFT",
      repositoryId: publication.repositoryId,
      publicationId: publication.id,
      authorId: userId,
      excerpt: content.slice(0, 200).replace(/[#*`\n]/g, " ").trim(),
      readingMinutes: calcReadingMinutes(content),
    },
    include: { publication: { select: { handle: true, name: true } } },
  });
}

export async function updateArticle(
  documentId: string,
  userId: string,
  data: { title?: string; subtitle?: string | null; content?: string; coverImage?: string | null }
) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { publication: true },
  });
  if (!doc) return null;

  if (doc.authorId !== userId) {
    if (!doc.publicationId) return null;
    const role = await getMemberRole(doc.publicationId, userId);
    if (!role || !canEditArticle(role)) return null;
  }

  const content = data.content ?? doc.content;
  return prisma.document.update({
    where: { id: documentId },
    data: {
      title: data.title ?? doc.title,
      subtitle: data.subtitle !== undefined ? data.subtitle : doc.subtitle,
      content,
      coverImage: data.coverImage !== undefined ? data.coverImage : doc.coverImage,
      excerpt: content.slice(0, 200).replace(/[#*`\n]/g, " ").trim(),
      readingMinutes: calcReadingMinutes(content),
    },
  });
}

export async function publishArticle(documentId: string, userId: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc || doc.status === "ARCHIVED") return null;

  if (doc.authorId !== userId) {
    if (!doc.publicationId) return null;
    const role = await getMemberRole(doc.publicationId, userId);
    if (!role || !canPublishArticle(role)) return null;
  }

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: {
      status: "PUBLISHED",
      publishedAt: doc.publishedAt ?? new Date(),
    },
    include: {
      publication: { select: { handle: true, name: true } },
      author: { select: { username: true } },
    },
  });

  await trackEvent({
    eventType: "article_published",
    userId,
    entityType: "document",
    entityId: documentId,
  });

  return updated;
}

export async function archiveArticle(documentId: string, userId: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return null;
  if (doc.authorId !== userId) {
    if (!doc.publicationId) return null;
    const role = await getMemberRole(doc.publicationId, userId);
    if (!role || !canPublishArticle(role)) return null;
  }
  return prisma.document.update({
    where: { id: documentId },
    data: { status: "ARCHIVED" },
  });
}
