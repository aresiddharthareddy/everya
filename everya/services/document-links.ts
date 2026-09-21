import type { DocumentLinkType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canEditTraceContent, getTraceRole } from "@/lib/permissions/trace";
import { traceDocumentHref } from "@/services/traces";
import { canExposeDocumentInGraph, getDocumentKnowledge } from "@/services/knowledge";
import { trackEvent } from "@/services/analytics";

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

export async function getDocumentLinks(documentId: string, userId?: string): Promise<DocumentLinkView[]> {
  const knowledge = await getDocumentKnowledge(documentId, userId);
  if (!knowledge) return [];
  const outbound = await prisma.documentLink.findMany({
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
  });
  const allowedIds = new Set(
    [...knowledge.outbound, ...knowledge.inbound].map((l) => l.document.id)
  );
  return outbound
    .filter((l) => allowedIds.has(l.toDocument.id))
    .map((l) => ({ id: l.id, type: l.type, document: l.toDocument }));
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

  if (!(await canExposeDocumentInGraph(toDocumentId, actorId))) {
    return { error: "invalid" as const };
  }

  const link = await prisma.documentLink.upsert({
    where: { fromDocumentId_toDocumentId_type: { fromDocumentId, toDocumentId, type } },
    create: { fromDocumentId, toDocumentId, type, createdById: actorId },
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

  await trackEvent({
    eventType: "knowledge_link_created",
    userId: actorId,
    entityType: "document_link",
    entityId: link.id,
    metadata: { fromDocumentId, toDocumentId, type },
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
  await trackEvent({
    eventType: "knowledge_link_removed",
    userId: actorId,
    entityType: "document_link",
    entityId: linkId,
  });
  return { ok: true as const };
}

export function linkTypeLabel(type: DocumentLinkType) {
  const labels: Record<DocumentLinkType, string> = {
    RELATED: "Related",
    REFERENCES: "References",
    DEPENDS_ON: "Depends on",
    PREVIOUS: "Previous",
    NEXT: "Next",
    PART_OF: "Part of",
  };
  return labels[type];
}
