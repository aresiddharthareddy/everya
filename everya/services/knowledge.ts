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

export type DocRefView = { id: string; title: string; href: string };

export type SharedTagGroup = { tag: string; documents: DocRefView[] };

const DISCOVERY_DOC_LIMIT = 12;
const TOP_DOC_LIMIT = 5;

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

  const previous = outboundLinks.find((l) => l.type === "PREVIOUS") ?? null;
  const next = outboundLinks.find((l) => l.type === "NEXT") ?? null;
  const linkedIds = new Set([documentId, ...outboundLinks.map((l) => l.document.id), ...inboundLinks.map((l) => l.document.id)]);

  const [sourceTags, siblingCandidates] = await Promise.all([
    prisma.documentTag.findMany({
      where: { documentId },
      include: { tag: { select: { id: true, name: true } } },
    }),
    prisma.document.findMany({
      where: { repositoryId: source.repositoryId, status: "PUBLISHED", id: { not: documentId } },
      select: docSelect,
      orderBy: { readerCount: "desc" },
      take: DISCOVERY_DOC_LIMIT * 2,
    }),
  ]);

  const sameTrace: DocRefView[] = [];
  for (const d of siblingCandidates) {
    if (linkedIds.has(d.id)) continue;
    if (!(await canExposeDocumentInGraph(d.id, userId))) continue;
    sameTrace.push({ id: d.id, title: d.title, href: docHref(d) });
    if (sameTrace.length >= DISCOVERY_DOC_LIMIT) break;
  }

  const sharedTags: SharedTagGroup[] = [];
  if (sourceTags.length) {
    const tagIds = sourceTags.map((t) => t.tag.id);
    const tagged = await prisma.document.findMany({
      where: {
        id: { not: documentId },
        status: "PUBLISHED",
        repositoryId: source.repositoryId,
        tags: { some: { tagId: { in: tagIds } } },
      },
      select: {
        ...docSelect,
        tags: { include: { tag: { select: { id: true, name: true } } } },
      },
      take: DISCOVERY_DOC_LIMIT * 3,
    });
    const byTag = new Map<string, DocRefView[]>();
    for (const d of tagged) {
      if (linkedIds.has(d.id) || sameTrace.some((s) => s.id === d.id)) continue;
      if (!(await canExposeDocumentInGraph(d.id, userId))) continue;
      for (const t of d.tags) {
        if (!tagIds.includes(t.tag.id)) continue;
        const list = byTag.get(t.tag.name) ?? [];
        if (list.some((x) => x.id === d.id)) continue;
        list.push({ id: d.id, title: d.title, href: docHref(d) });
        byTag.set(t.tag.name, list);
      }
    }
    for (const st of sourceTags) {
      const docs = byTag.get(st.tag.name);
      if (docs?.length) sharedTags.push({ tag: st.tag.name, documents: docs.slice(0, 6) });
    }
  }

  const publication = source.publicationId && source.repository.publication
    ? { name: source.repository.publication.name, href: `/p/${source.repository.publication.handle}` }
    : null;

  return {
    trace: {
      name: source.repository.name,
      href: traceHref(source.repository),
    },
    publication,
    outbound: outboundLinks.filter((l) => l.direction === "outbound" && !navTypes.has(l.type)),
    inbound: inboundLinks,
    related: knowledge.filter((l) => l.type === "RELATED"),
    references: outboundLinks.filter((l) => l.type === "REFERENCES"),
    referencedBy: inboundLinks.filter((l) => l.type === "REFERENCES"),
    dependencies: outboundLinks.filter((l) => l.type === "DEPENDS_ON"),
    partOf: outboundLinks.filter((l) => l.type === "PART_OF"),
    previous,
    next,
    sameTrace,
    sharedTags,
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

export function buildReadingPaths(
  edges: { type: DocumentLinkType; fromId: string; toId: string; fromTitle: string; toTitle: string }[],
  hrefFor: (id: string) => string
) {
  const nextOf = new Map<string, string>();
  const titles = new Map<string, string>();
  const hasIncomingNext = new Set<string>();

  for (const e of edges) {
    titles.set(e.fromId, e.fromTitle);
    titles.set(e.toId, e.toTitle);
    if (e.type === "NEXT") {
      nextOf.set(e.fromId, e.toId);
      hasIncomingNext.add(e.toId);
    }
  }

  const paths: { documents: DocRefView[] }[] = [];
  const used = new Set<string>();

  for (const startId of nextOf.keys()) {
    if (hasIncomingNext.has(startId) || used.has(startId)) continue;
    const documents: DocRefView[] = [];
    let cur: string | undefined = startId;
    const seen = new Set<string>();
    while (cur && !seen.has(cur) && documents.length < 25) {
      seen.add(cur);
      documents.push({ id: cur, title: titles.get(cur) || "Document", href: hrefFor(cur) });
      used.add(cur);
      cur = nextOf.get(cur);
    }
    if (documents.length >= 2) paths.push({ documents });
  }

  return paths;
}

export async function getTraceIntelligence(repositoryId: string, userId?: string) {
  const knowledge = await getTraceKnowledge(repositoryId, userId);
  if (!knowledge) return null;

  const repo = await prisma.repository.findUnique({
    where: { id: repositoryId },
    select: { description: true },
  });

  const docsWithMeta = await prisma.document.findMany({
    where: { repositoryId, status: "PUBLISHED" },
    select: { id: true, title: true, slug: true, readerCount: true, readingMinutes: true },
    orderBy: { readerCount: "desc" },
    take: 20,
  });

  const slugMap = new Map(knowledge.documents.map((d) => [d.id, d.slug]));
  const baseHref = knowledge.trace.href;
  const topDocuments: (DocRefView & { readerCount: number; readingMinutes: number })[] = [];
  for (const d of docsWithMeta) {
    if (!(await canExposeDocumentInGraph(d.id, userId))) continue;
    const slug = slugMap.get(d.id);
    if (!slug) continue;
    topDocuments.push({
      id: d.id,
      title: d.title,
      href: `${baseHref}/${slug}`,
      readerCount: d.readerCount,
      readingMinutes: d.readingMinutes,
    });
    if (topDocuments.length >= TOP_DOC_LIMIT) break;
  }

  const hrefFor = (id: string) => {
    const slug = slugMap.get(id);
    return slug ? `${baseHref}/${slug}` : baseHref;
  };

  const tagRows = await prisma.documentTag.findMany({
    where: { document: { repositoryId, status: "PUBLISHED" } },
    include: { tag: { select: { name: true, slug: true } } },
    take: 50,
  });
  const tagCounts = new Map<string, { name: string; slug: string; count: number }>();
  for (const row of tagRows) {
    const cur = tagCounts.get(row.tagId) ?? { name: row.tag.name, slug: row.tag.slug, count: 0 };
    cur.count += 1;
    tagCounts.set(row.tagId, cur);
  }
  const tags = [...tagCounts.values()].sort((a, b) => b.count - a.count).slice(0, 8);

  return {
    ...knowledge,
    description: repo?.description ?? null,
    documentCount: knowledge.documents.length,
    relationshipCount: knowledge.edges.length,
    linkedTraceCount: knowledge.relatedTraces.length,
    topDocuments,
    readingPaths: buildReadingPaths(knowledge.edges, hrefFor),
    tags,
  };
}

export async function getPublicationKnowledge(handle: string, userId?: string) {
  const publication = await prisma.publication.findUnique({
    where: { handle },
    select: { id: true, name: true, handle: true, description: true, visibility: true, repositoryId: true },
  });
  if (!publication) return null;

  const intelligence = await getTraceIntelligence(publication.repositoryId, userId);
  if (!intelligence) return null;

  const pubDocHref = (id: string) => {
    const slug = intelligence.documents.find((d) => d.id === id)?.slug;
    return slug ? `/p/${publication.handle}/${slug}` : `/p/${publication.handle}`;
  };

  return {
    publication: {
      name: publication.name,
      handle: publication.handle,
      href: `/p/${publication.handle}`,
      description: publication.description,
    },
    trace: intelligence.trace,
    documents: intelligence.documents,
    edges: intelligence.edges,
    relatedTraces: intelligence.relatedTraces,
    documentCount: intelligence.documentCount,
    relationshipCount: intelligence.relationshipCount,
    topDocuments: intelligence.topDocuments.map((d) => ({ ...d, href: pubDocHref(d.id) })),
    readingPaths: intelligence.readingPaths.map((path) => ({
      documents: path.documents.map((d) => ({ ...d, href: pubDocHref(d.id) })),
    })),
    tags: intelligence.tags,
    linkedTraceCount: intelligence.linkedTraceCount,
  };
}

export async function getExploreKnowledgeHints() {
  const [traces, documents] = await Promise.all([
    prisma.repository.findMany({
      where: { visibility: "PUBLIC", publication: null },
      include: {
        owner: { select: { username: true } },
        _count: { select: { documents: true, linksFrom: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.document.findMany({
      where: {
        status: "PUBLISHED",
        accessLevel: "PUBLIC",
        OR: [
          { publication: { visibility: "PUBLIC" } },
          { publicationId: null, repository: { visibility: "PUBLIC" } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        publication: { select: { handle: true, name: true } },
        repository: { select: { slug: true, name: true, owner: { select: { username: true } } } },
        _count: { select: { linksFrom: true, linksTo: true } },
      },
      take: 40,
    }),
  ]);

  const connectedTraces = traces
    .filter((t) => t._count.linksFrom > 0 || t._count.documents > 0)
    .slice(0, 6)
    .map((t) => ({
      id: t.id,
      name: t.name,
      href: `/u/${t.owner.username}/trace/${t.slug}`,
      documentCount: t._count.documents,
      linkCount: t._count.linksFrom,
    }));

  const connectedDocuments = documents
    .map((d) => ({
      id: d.id,
      title: d.title,
      href: d.publication
        ? `/p/${d.publication.handle}/${d.slug}`
        : `/u/${d.repository.owner.username}/trace/${d.repository.slug}/${d.slug}`,
      linkCount: d._count.linksFrom + d._count.linksTo,
      context: d.publication?.name || d.repository.name,
    }))
    .filter((d) => d.linkCount > 0)
    .sort((a, b) => b.linkCount - a.linkCount)
    .slice(0, 6);

  return { connectedTraces, connectedDocuments };
}
