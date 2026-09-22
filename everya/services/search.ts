import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAiProvider, isAiConfigured } from "@/lib/ai";
import { cosineSimilarity } from "@/lib/ai/similarity";
import { listPublicDocumentIndexes } from "@/services/indexing";
import type { SearchResponse, SearchResult } from "@/types";

const SEMANTIC_MIN_SCORE = 0.3;
const SEMANTIC_MAX = 10;

const publicDocumentWhere: Prisma.DocumentWhereInput = {
  status: "PUBLISHED",
  accessLevel: "PUBLIC",
  OR: [
    { publication: { visibility: "PUBLIC" } },
    { publicationId: null, repository: { visibility: "PUBLIC" } },
  ],
};

const documentInclude = {
  publication: { select: { handle: true, name: true } },
  repository: { select: { slug: true, name: true, owner: { select: { username: true } } } },
  _count: { select: { linksFrom: true, linksTo: true } },
} satisfies Prisma.DocumentInclude;

function documentHref(d: {
  slug: string;
  publication: { handle: string } | null;
  repository: { slug: string; owner: { username: string } };
}) {
  return d.publication
    ? `/p/${d.publication.handle}/${d.slug}`
    : `/u/${d.repository.owner.username}/trace/${d.repository.slug}/${d.slug}`;
}

function mapDocument(d: {
  id: string;
  title: string;
  slug: string;
  publication: { handle: string; name: string } | null;
  repository: { slug: string; name: string; owner: { username: string } };
  _count: { linksFrom: number; linksTo: number };
}, matchType: SearchResult["matchType"]): SearchResult {
  return {
    type: "document",
    id: d.id,
    title: d.title,
    subtitle: d.publication
      ? `${d.publication.name} · @${d.publication.handle} · ${d._count.linksFrom + d._count.linksTo} links`
      : `${d.repository.name} · @${d.repository.owner.username} · ${d._count.linksFrom + d._count.linksTo} links`,
    href: documentHref(d),
    matchType,
  };
}

async function searchSemanticDocuments(query: string, excludeIds: Set<string>, limit: number) {
  const ai = getAiProvider();
  if (!ai.isConfigured()) return [];

  const embedded = await ai.generateEmbedding({ text: query });
  if (!embedded.ok) return [];

  const indexes = await listPublicDocumentIndexes(500);
  const scored: { entityId: string; score: number }[] = [];

  for (const row of indexes) {
    if (!row.embedding || excludeIds.has(row.entityId)) continue;
    let vec: number[];
    try {
      vec = JSON.parse(row.embedding) as number[];
    } catch {
      continue;
    }
    if (!Array.isArray(vec) || vec.length !== embedded.data.length) continue;
    const score = cosineSimilarity(embedded.data, vec);
    if (score >= SEMANTIC_MIN_SCORE) scored.push({ entityId: row.entityId, score });
  }

  scored.sort((a, b) => b.score - a.score);
  const topIds = scored.slice(0, Math.min(limit, SEMANTIC_MAX)).map((s) => s.entityId);
  if (!topIds.length) return [];

  const documents = await prisma.document.findMany({
    where: { id: { in: topIds }, ...publicDocumentWhere },
    include: documentInclude,
  });

  const order = new Map(topIds.map((id, i) => [id, i]));
  return documents
    .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99))
    .map((d) => mapDocument(d, "semantic"));
}

export async function searchAll(
  query: string,
  opts?: { type?: "all" | "articles" | "authors" | "publications"; limit?: number; semantic?: boolean }
): Promise<SearchResponse> {
  const q = query.trim();
  const limit = opts?.limit ?? 20;
  const semanticAvailable = isAiConfigured();
  if (!q || q.length < 2) {
    return { results: [], semanticAvailable, semanticUsed: false };
  }

  const type = opts?.type ?? "all";
  const results: SearchResult[] = [];
  const keywordDocIds = new Set<string>();

  if (type === "all") {
    const traces = await prisma.repository.findMany({
      where: {
        visibility: "PUBLIC",
        publication: null,
        OR: [{ name: { contains: q } }, { description: { contains: q } }, { slug: { contains: q } }],
      },
      take: limit,
      include: { owner: { select: { username: true } } },
      orderBy: { updatedAt: "desc" },
    });
    results.push(
      ...traces.map((t) => ({
        type: "trace" as const,
        id: t.id,
        title: t.name,
        subtitle: `@${t.owner.username}`,
        href: `/u/${t.owner.username}/trace/${t.slug}`,
        matchType: "keyword" as const,
      }))
    );
  }

  if (type === "all" || type === "publications") {
    const publications = await prisma.publication.findMany({
      where: {
        visibility: "PUBLIC",
        OR: [{ name: { contains: q } }, { handle: { contains: q } }, { description: { contains: q } }],
      },
      take: limit,
      include: { owner: { select: { username: true } } },
    });
    results.push(
      ...publications.map((p) => ({
        type: "publication" as const,
        id: p.id,
        title: p.name,
        subtitle: `@${p.handle}`,
        href: `/p/${p.handle}`,
        matchType: "keyword" as const,
      }))
    );
  }

  if (type === "all" || type === "authors") {
    const users = await prisma.user.findMany({
      where: {
        OR: [{ username: { contains: q } }, { name: { contains: q } }, { bio: { contains: q } }],
      },
      take: limit,
      select: { id: true, username: true, name: true, bio: true },
    });
    results.push(
      ...users.map((u) => ({
        type: "author" as const,
        id: u.id,
        title: u.name || `@${u.username}`,
        subtitle: `@${u.username}`,
        href: `/u/${u.username}`,
        matchType: "keyword" as const,
      }))
    );
  }

  if (type === "all" || type === "articles") {
    const documents = await prisma.document.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: q } },
              { subtitle: { contains: q } },
              { content: { contains: q } },
              { excerpt: { contains: q } },
            ],
          },
          publicDocumentWhere,
        ],
      },
      take: limit,
      include: documentInclude,
      orderBy: { updatedAt: "desc" },
    });
    for (const d of documents) {
      keywordDocIds.add(d.id);
      results.push(mapDocument(d, "keyword"));
    }
  }

  let semanticUsed = false;
  if (opts?.semantic && (type === "all" || type === "articles")) {
    const semantic = await searchSemanticDocuments(q, keywordDocIds, limit);
    if (semantic.length) {
      semanticUsed = true;
      results.push(...semantic);
    }
  }

  return {
    results: results.slice(0, limit + (semanticUsed ? SEMANTIC_MAX : 0)),
    semanticAvailable,
    semanticUsed,
  };
}
