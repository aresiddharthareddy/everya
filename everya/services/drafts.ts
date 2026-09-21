import { prisma } from "@/lib/prisma";
import { canUserEditDocument } from "@/lib/document-edit-access";
import { draftEditHref } from "@/lib/draft-links";

const draftInclude = {
  repository: {
    select: {
      slug: true,
      name: true,
      owner: { select: { username: true } },
      publication: { select: { handle: true } },
    },
  },
  publication: { select: { handle: true, name: true } },
  author: { select: { username: true, name: true } },
};

export async function listEditableDrafts(userId: string, limit = 50) {
  const candidates = await prisma.document.findMany({
    where: {
      status: "DRAFT",
      OR: [
        { authorId: userId },
        { repository: { ownerId: userId } },
        { repository: { members: { some: { userId } } } },
        { publication: { members: { some: { userId } } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: limit * 2,
    include: draftInclude,
  });

  const editable = [];
  for (const doc of candidates) {
    if (await canUserEditDocument(doc, userId)) editable.push(doc);
    if (editable.length >= limit) break;
  }

  return editable.map((doc) => ({
    id: doc.id,
    title: doc.title,
    slug: doc.slug,
    updatedAt: doc.updatedAt,
    editHref: draftEditHref({
      id: doc.id,
      slug: doc.slug,
      publicationId: doc.publicationId,
      publication: doc.publication,
      repository: doc.repository,
    }),
    contextLabel: doc.publication
      ? doc.publication.name
      : doc.repository.name,
    author: doc.author,
  }));
}

export async function getTraceDrafts(repositoryId: string, userId: string) {
  const role = await prisma.repository.findUnique({
    where: { id: repositoryId },
    select: { ownerId: true },
  });
  if (!role) return [];

  const canList =
    role.ownerId === userId ||
    !!(await prisma.traceMember.findUnique({
      where: { repositoryId_userId: { repositoryId, userId } },
    }));
  if (!canList) return [];

  const drafts = await prisma.document.findMany({
    where: { repositoryId, status: "DRAFT", publicationId: null },
    orderBy: { updatedAt: "desc" },
    include: draftInclude,
  });

  const editable = [];
  for (const doc of drafts) {
    if (await canUserEditDocument(doc, userId)) editable.push(doc);
  }

  return editable.map((doc) => ({
    id: doc.id,
    title: doc.title,
    slug: doc.slug,
    updatedAt: doc.updatedAt,
    editHref: draftEditHref({
      id: doc.id,
      slug: doc.slug,
      publicationId: doc.publicationId,
      publication: doc.publication,
      repository: doc.repository,
    }),
    author: doc.author,
  }));
}

export async function deleteDraftDocument(documentId: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      status: true,
      authorId: true,
      repositoryId: true,
      publicationId: true,
    },
  });
  if (!doc || doc.status !== "DRAFT") return null;
  if (!(await canUserEditDocument(doc, userId))) return null;

  await prisma.document.delete({ where: { id: documentId } });
  return { ok: true };
}
