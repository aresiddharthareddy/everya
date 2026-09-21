import type { ArticleStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canUserEditDocument } from "@/lib/document-edit-access";
import { revisionContentChanged, revisionMatchesSnapshot } from "@/lib/document-revision";
import { calcReadingMinutes } from "@/lib/utils";

type RevisionSnapshot = {
  title: string;
  subtitle: string | null;
  content: string;
  excerpt: string | null;
  status: ArticleStatus;
};

type RevisionDb = Prisma.TransactionClient | typeof prisma;

async function createRevisionRecord(
  db: RevisionDb,
  documentId: string,
  userId: string,
  snapshot: RevisionSnapshot
) {
  const latest = await db.documentRevision.findFirst({
    where: { documentId },
    orderBy: { revisionNumber: "desc" },
    select: { title: true, subtitle: true, content: true, revisionNumber: true },
  });

  if (latest && revisionMatchesSnapshot(latest, snapshot)) return null;

  const revisionNumber = (latest?.revisionNumber ?? 0) + 1;
  return db.documentRevision.create({
    data: {
      documentId,
      revisionNumber,
      title: snapshot.title,
      subtitle: snapshot.subtitle,
      content: snapshot.content,
      excerpt: snapshot.excerpt,
      status: snapshot.status,
      createdById: userId,
    },
    include: {
      createdBy: { select: { id: true, username: true, name: true } },
    },
  });
}

export async function recordDocumentRevision(
  documentId: string,
  userId: string,
  snapshot: RevisionSnapshot
) {
  return createRevisionRecord(prisma, documentId, userId, snapshot);
}

export async function snapshotDocumentAfterSave(
  documentId: string,
  userId: string,
  before: RevisionSnapshot,
  after: RevisionSnapshot
) {
  if (!revisionContentChanged(before, after)) return null;
  return createRevisionRecord(prisma, documentId, userId, after);
}

export async function listDocumentRevisions(documentId: string, userId: string, limit = 20) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { authorId: true, repositoryId: true, publicationId: true },
  });
  if (!doc || !(await canUserEditDocument(doc, userId))) return null;

  return prisma.documentRevision.findMany({
    where: { documentId },
    orderBy: { revisionNumber: "desc" },
    take: limit,
    include: {
      createdBy: { select: { id: true, username: true, name: true } },
    },
  });
}

export async function restoreDocumentRevision(
  documentId: string,
  revisionId: string,
  userId: string
) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      title: true,
      subtitle: true,
      content: true,
      excerpt: true,
      status: true,
      authorId: true,
      repositoryId: true,
      publicationId: true,
    },
  });
  if (!doc || !(await canUserEditDocument(doc, userId))) return null;

  const revision = await prisma.documentRevision.findFirst({
    where: { id: revisionId, documentId },
  });
  if (!revision) return null;

  const before: RevisionSnapshot = {
    title: doc.title,
    subtitle: doc.subtitle,
    content: doc.content,
    excerpt: doc.excerpt,
    status: doc.status,
  };
  const restored: RevisionSnapshot = {
    title: revision.title,
    subtitle: revision.subtitle,
    content: revision.content,
    excerpt: revision.excerpt,
    status: revision.status,
  };

  return prisma.$transaction(async (tx) => {
    if (revisionContentChanged(before, restored)) {
      await createRevisionRecord(tx, documentId, userId, before);
    }

    const updated = await tx.document.update({
      where: { id: documentId },
      data: {
        title: revision.title,
        subtitle: revision.subtitle,
        content: revision.content,
        excerpt:
          revision.excerpt ?? revision.content.slice(0, 200).replace(/[#*`\n]/g, " ").trim(),
        readingMinutes: calcReadingMinutes(revision.content),
        lastEditedById: userId,
      },
    });

    await createRevisionRecord(tx, documentId, userId, {
      title: updated.title,
      subtitle: updated.subtitle,
      content: updated.content,
      excerpt: updated.excerpt,
      status: updated.status,
    });

    return updated;
  });
}
