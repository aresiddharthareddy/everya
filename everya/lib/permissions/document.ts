import { prisma } from "@/lib/prisma";
import { canViewRepo } from "@/lib/access";

const repositorySelect = {
  visibility: true,
  ownerId: true,
  slug: true,
  owner: { select: { username: true } },
};

export type AccessibleDocument = NonNullable<
  Awaited<ReturnType<typeof assertDocumentAccessible>>
>;

/** Returns document when visible to user; null if missing or inaccessible (use 404 for both). */
export async function assertDocumentAccessible(documentId: string, userId?: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { repository: { select: repositorySelect } },
  });
  if (!document || !canViewRepo(document.repository, userId)) return null;
  return document;
}

export function commentParentMatchesDocument(
  parent: { documentId: string } | null,
  documentId: string
) {
  return !!parent && parent.documentId === documentId;
}
