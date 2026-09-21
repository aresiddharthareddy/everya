import type { DocumentLinkType, TraceLinkType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canViewRepo } from "@/lib/access";
import { canViewArticleContent } from "@/lib/permissions/document";
import { assertCanViewTrace } from "@/services/traces";
import { traceDocumentHref, traceHref } from "@/services/traces";
import { trackEvent } from "@/services/analytics";

export const KNOWLEDGE_EDGE_LIMIT = 100;

const docSelect = {
  id: true,
  title: true,
  slug: true,
  status: true,
  authorId: true,
  publicationId: true,
  repositoryId: true,
  accessLevel: true,
  repository: {
    select: {
      id: true,
      slug: true,
      visibility: true,
      ownerId: true,
      name: true,
      owner: { select: { username: true } },
      publication: { select: { handle: true, name: true } },
    },
  },
};

type DocRow = Awaited<ReturnType<typeof loadDocForAuth>>;

async function loadDocForAuth(documentId: string) {
  return prisma.document.findUnique({ where: { id: documentId }, select: docSelect });
}

async function publicationRole(publicationId: string | null, userId?: string) {
  if (!publicationId || !userId) return null;
  const m = await prisma.publicationMember.findUnique({
    where: { publicationId_userId: { publicationId, userId } },
    select: { role: true },
  });
  return m?.role ?? null;
}

async function traceEditor(repositoryId: string, userId?: string) {
  if (!userId) return false;
  const m = await prisma.traceMember.findUnique({
    where: { repositoryId_userId: { repositoryId, userId } },
    select: { role: true },
  });
  return m?.role === "EDITOR";
}

export async function canExposeDocumentInGraph(documentId: string, userId?: string) {
  const doc = await loadDocForAuth(documentId);
  if (!doc) return false;
  const pubRole = await publicationRole(doc.publicationId, userId);
  return canViewArticleContent(doc, userId, pubRole, await traceEditor(doc.repositoryId, userId));
}

function docHref(doc: DocRow) {
  if (!doc) return "/";
  if (doc.publicationId && doc.repository.publication) {
    return `/p/${doc.repository.publication.handle}/${doc.slug}`;
  }
  return traceDocumentHref(doc.repository, doc.slug);
}

export type KnowledgeLinkView = {
  id: string;
  type: DocumentLinkType;
  direction: "outbound" | "inbound";
  href: string;
  document: { id: string; title: string; slug: string };
};

export async function getDocumentKnowledge(documentId: string, userId?: string) {
  const source = await loadDocForAuth(documentId);
  if (!source) return null;
  const pubRole = await publicationRole(source.publicationId, userId);
  const canViewSource = await canViewArticleContent(
    source,
    userId,
    pubRole,
    await traceEditor(source.repositoryId, userId)
  );
  if (!canViewSource) return null;

  const [outbound, inbound] = await Promise.all([
    prisma.documentLink.findMany({
      where: { fromDocumentId: documentId },
      include: { toDocument: { select: docSelect } },
      orderBy: { createdAt: "asc" },
      take: KNOWLEDGE_EDGE_LIMIT,
    }),
    prisma.documentLink.findMany({
      where: { toDocumentId: documentId },
      include: { fromDocument: { select: docSelect } },
      orderBy: { createdAt: "asc" },
      take: KNOWLEDGE_EDGE_LIMIT,
    }),
  ]);

  const outboundLinks: KnowledgeLinkView[] = [];
  for (const l of outbound) {
    if (!(await canExposeDocumentInGraph(l.toDocumentId, userId))) continue;
    outboundLinks.push({
      id: l.id,
      type: l.type,
      direction: "outbound",
      href: docHref(l.toDocument),
      document: { id: l.toDocument.id, title: l.toDocument.title, slug: l.toDocument.slug },
    });
  }

  const inboundLinks: KnowledgeLinkView[] = [];
  for (const l of inbound) {
    if (!(await canExposeDocumentInGraph(l.fromDocumentId, userId))) continue;
    inboundLinks.push({
      id: l.id,
      type: l.type,
      direction: "inbound",
      href: docHref(l.fromDocument),
      document: { id: l.fromDocument.id, title: l.fromDocument.title, slug: l.fromDocument.slug },
    });
  }

  const navTypes = new Set<DocumentLinkType>(["PREVIOUS", "NEXT"]);
  const knowledge = [...outboundLinks, ...inboundLinks].filter((l) => !navTypes.has(l.type));

  return {
    trace: {
      name: source.repository.name,
      href: traceHref(source.repository),
    },
    outbound: outboundLinks.filter((l) => l.direction === "outbound" && !navTypes.has(l.type)),
    inbound: inboundLinks,
    related: knowledge.filter((l) => l.type === "RELATED"),
    references: outboundLinks.filter((l) => l.type === "REFERENCES"),
    referencedBy: inboundLinks.filter((l) => l.type === "REFERENCES"),
    dependencies: outboundLinks.filter((l) => l.type === "DEPENDS_ON"),
    partOf: outboundLinks.filter((l) => l.type === "PART_OF"),
  };
}

export async function getTraceKnowledge(repositoryId: string, userId?: string) {
  const repo = await prisma.repository.findUnique({
    where: { id: repositoryId },
    include: { owner: { select: { username: true } }, publication: { select: { handle: true, name: true } } },
  });
  if (!repo || !(await assertCanViewTrace(repo, userId))) return null;

  const [documents, docLinks, traceLinksOut, traceLinksIn] = await Promise.all([
    prisma.document.findMany({
      where: { repositoryId, status: "PUBLISHED" },
      select: { id: true, title: true, slug: true },
      orderBy: { title: "asc" },
      take: KNOWLEDGE_EDGE_LIMIT,
    }),
    prisma.documentLink.findMany({
      where: {
        OR: [
          { fromDocument: { repositoryId } },
          { toDocument: { repositoryId } },
        ],
      },
      include: {
        fromDocument: { select: docSelect },
        toDocument: { select: docSelect },
      },
      take: KNOWLEDGE_EDGE_LIMIT,
    }),
    prisma.traceLink.findMany({
      where: { fromRepositoryId: repositoryId },
      include: { toRepository: { include: { owner: { select: { username: true } } } } },
      take: 50,
    }),
    prisma.traceLink.findMany({
      where: { toRepositoryId: repositoryId },
      include: { fromRepository: { include: { owner: { select: { username: true } } } } },
      take: 50,
    }),
  ]);

  const visibleDocs: { id: string; title: string; slug: string }[] = [];
  for (const d of documents) {
    if (await canExposeDocumentInGraph(d.id, userId)) visibleDocs.push(d);
  }
  const docIds = new Set(visibleDocs.map((d) => d.id));

  const edges: { id: string; type: DocumentLinkType; fromId: string; toId: string; fromTitle: string; toTitle: string }[] = [];
  for (const l of docLinks) {
    const fromOk = await canExposeDocumentInGraph(l.fromDocumentId, userId);
    const toOk = await canExposeDocumentInGraph(l.toDocumentId, userId);
    if (!fromOk || !toOk) continue;
    if (!docIds.has(l.fromDocumentId) || !docIds.has(l.toDocumentId)) continue;
    edges.push({
      id: l.id,
      type: l.type,
      fromId: l.fromDocumentId,
      toId: l.toDocumentId,
      fromTitle: l.fromDocument.title,
      toTitle: l.toDocument.title,
    });
  }

  const relatedTraces: { id: string; name: string; href: string; direction: "outbound" | "inbound" }[] = [];
  for (const l of traceLinksOut) {
    if (!(await assertCanViewTrace(l.toRepository, userId))) continue;
    relatedTraces.push({
      id: l.id,
      name: l.toRepository.name,
      href: traceHref(l.toRepository),
      direction: "outbound",
    });
  }
  for (const l of traceLinksIn) {
    if (!(await assertCanViewTrace(l.fromRepository, userId))) continue;
    relatedTraces.push({
      id: l.id,
      name: l.fromRepository.name,
      href: traceHref(l.fromRepository),
      direction: "inbound",
    });
  }

  const publication = repo.publication
    ? { name: repo.publication.name, href: `/p/${repo.publication.handle}` }
    : null;

  return {
    trace: { id: repo.id, name: repo.name, href: traceHref(repo) },
    publication,
    documents: visibleDocs,
    edges,
    relatedTraces,
  };
}

export async function addTraceLink(
  fromRepositoryId: string,
  toRepositoryId: string,
  actorId: string,
  type: TraceLinkType = "RELATED"
) {
  if (fromRepositoryId === toRepositoryId) return { error: "invalid" as const };

  const from = await prisma.repository.findUnique({
    where: { id: fromRepositoryId },
    select: { id: true, ownerId: true, visibility: true },
  });
  if (!from || !canViewRepo(from, actorId)) return { error: "forbidden" as const };

  const role = await prisma.traceMember.findUnique({
    where: { repositoryId_userId: { repositoryId: fromRepositoryId, userId: actorId } },
  });
  if (from.ownerId !== actorId && role?.role !== "EDITOR") return { error: "forbidden" as const };

  const to = await prisma.repository.findUnique({
    where: { id: toRepositoryId },
    select: { id: true, ownerId: true, visibility: true, name: true, slug: true, owner: { select: { username: true } } },
  });
  if (!to || !(await assertCanViewTrace(to, actorId))) return { error: "invalid" as const };

  const link = await prisma.traceLink.upsert({
    where: { fromRepositoryId_toRepositoryId_type: { fromRepositoryId, toRepositoryId, type } },
    create: { fromRepositoryId, toRepositoryId, type, createdById: actorId },
    update: {},
    include: { toRepository: { include: { owner: { select: { username: true } } } } },
  });

  await trackEvent({
    eventType: "knowledge_link_created",
    userId: actorId,
    entityType: "trace_link",
    entityId: link.id,
    metadata: { fromRepositoryId, toRepositoryId, type },
  });

  return { link: { id: link.id, name: link.toRepository.name, href: traceHref(link.toRepository) } };
}

export async function removeTraceLink(linkId: string, actorId: string) {
  const link = await prisma.traceLink.findUnique({
    where: { id: linkId },
    include: { fromRepository: { select: { ownerId: true, id: true } } },
  });
  if (!link) return { error: "not_found" as const };

  const role = await prisma.traceMember.findUnique({
    where: { repositoryId_userId: { repositoryId: link.fromRepositoryId, userId: actorId } },
  });
  if (link.fromRepository.ownerId !== actorId && role?.role !== "EDITOR") {
    return { error: "forbidden" as const };
  }

  await prisma.traceLink.delete({ where: { id: linkId } });
  await trackEvent({
    eventType: "knowledge_link_removed",
    userId: actorId,
    entityType: "trace_link",
    entityId: linkId,
  });
  return { ok: true as const };
}

export async function countDocumentRelations(documentId: string, userId?: string) {
  const knowledge = await getDocumentKnowledge(documentId, userId);
  if (!knowledge) return 0;
  return knowledge.outbound.length + knowledge.inbound.length;
}
