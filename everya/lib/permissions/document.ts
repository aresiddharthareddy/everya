import { prisma } from "@/lib/prisma";
import { canViewRepo } from "@/lib/access";
import { roleAtLeast } from "./publication";
import type { PublicationRole } from "@prisma/client";

const repositorySelect = {
  visibility: true,
  ownerId: true,
  slug: true,
  owner: { select: { username: true } },
};

export type AccessibleDocument = NonNullable<
  Awaited<ReturnType<typeof assertDocumentAccessible>>
>;

async function getMemberRole(publicationId: string, userId: string): Promise<PublicationRole | null> {
  const m = await prisma.publicationMember.findUnique({
    where: { publicationId_userId: { publicationId, userId } },
    select: { role: true },
  });
  return m?.role ?? null;
}

export function canViewArticle(
  doc: {
    status: string;
    authorId: string;
    publicationId: string | null;
    repository: { visibility: string; ownerId: string };
  },
  userId?: string,
  memberRole?: PublicationRole | null
) {
  if (userId && doc.authorId === userId) return true;
  if (memberRole && roleAtLeast(memberRole, "CONTRIBUTOR")) return true;
  if (doc.status !== "PUBLISHED") return false;
  if (doc.publicationId) return doc.repository.visibility === "PUBLIC" || !!userId;
  return canViewRepo(doc.repository, userId);
}

/** Returns document when visible to user; null if missing or inaccessible (use 404 for both). */
export async function assertDocumentAccessible(documentId: string, userId?: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      repository: { select: repositorySelect },
      publication: { select: { id: true, visibility: true } },
    },
  });
  if (!document) return null;

  const memberRole = document.publicationId && userId
    ? await getMemberRole(document.publicationId, userId)
    : null;

  if (!canViewArticle(document, userId, memberRole)) return null;
  if (document.publication?.visibility === "PRIVATE" && !memberRole && document.authorId !== userId) {
    return null;
  }
  return document;
}

export function commentParentMatchesDocument(
  parent: { documentId: string } | null,
  documentId: string
) {
  return !!parent && parent.documentId === documentId;
}
