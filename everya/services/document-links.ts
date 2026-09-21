import type { DocumentLinkType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canEditTraceContent, getTraceRole } from "@/lib/permissions/trace";
import { traceDocumentHref } from "@/services/traces";

export type DocumentLinkView = {
  id: string;
  type: DocumentLinkType;
  document: {
    id: string;
    title: string;
    slug: string;
    repository: { slug: string; owner: { username: string } };
  };
};

export async function getDocumentLinks(documentId: string): Promise<DocumentLinkView[]> {
  const links = await prisma.documentLink.findMany({
    where: { fromDocumentId: documentId },
    include: {
      toDocument: {
        select: {
          id: true,
          title: true,
          slug: true,
          repository: { select: { slug: true, owner: { select: { username: true } } } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return links.map((l) => ({
    id: l.id,
    type: l.type,
    document: l.toDocument,
  }));
}

export async function addDocumentLink(
  fromDocumentId: string,
  actorId: string,
  toDocumentId: string,
  type: DocumentLinkType
) {
  const from = await prisma.document.findUnique({
    where: { id: fromDocumentId },
    select: { id: true, repositoryId: true, publicationId: true },
  });
  if (!from || from.publicationId) return { error: "not_found" as const };

  const role = await getTraceRole(from.repositoryId, actorId);
  if (!role || !canEditTraceContent(role)) return { error: "forbidden" as const };

  if (fromDocumentId === toDocumentId) return { error: "invalid" as const };

  const to = await prisma.document.findFirst({
    where: { id: toDocumentId, repositoryId: from.repositoryId },
    select: { id: true },
  });
  if (!to) return { error: "invalid" as const };

  const link = await prisma.documentLink.upsert({
    where: { fromDocumentId_toDocumentId_type: { fromDocumentId, toDocumentId, type } },
    create: { fromDocumentId, toDocumentId, type },
    update: {},
    include: {
      toDocument: {
        select: {
          id: true,
          title: true,
          slug: true,
          repository: { select: { slug: true, owner: { select: { username: true } } } },
        },
      },
    },
  });

  return {
    link: {
      id: link.id,
      type: link.type,
      href: traceDocumentHref(link.toDocument.repository, link.toDocument.slug),
      document: link.toDocument,
    },
  };
}

export async function removeDocumentLink(linkId: string, actorId: string) {
  const link = await prisma.documentLink.findUnique({
    where: { id: linkId },
    include: { fromDocument: { select: { repositoryId: true, publicationId: true } } },
  });
  if (!link || link.fromDocument.publicationId) return { error: "not_found" as const };

  const role = await getTraceRole(link.fromDocument.repositoryId, actorId);
  if (!role || !canEditTraceContent(role)) return { error: "forbidden" as const };

  await prisma.documentLink.delete({ where: { id: linkId } });
  return { ok: true as const };
}

export function linkTypeLabel(type: DocumentLinkType) {
  const labels: Record<DocumentLinkType, string> = {
    RELATED: "Related",
    PREVIOUS: "Previous",
    NEXT: "Next",
    PART_OF: "Part of",
  };
  return labels[type];
}
