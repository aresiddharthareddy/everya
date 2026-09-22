import { createHash } from "crypto";
import type { ContentAccessLevel, ContentIndexVisibility } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAiProvider } from "@/lib/ai";

export const INDEX_BODY_MAX_CHARS = 8000;

type IndexableDocument = {
  status: string;
  accessLevel: ContentAccessLevel;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  content: string;
  publication: { visibility: string; name: string; handle: string } | null;
  repository: { visibility: string; name: string; slug: string };
  tags: { tag: { name: string } }[];
};

export function computeContentHash(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

export function buildDocumentIndexText(doc: IndexableDocument) {
  const tags = doc.tags.map((t) => t.tag.name).join(" ");
  const body = doc.content.slice(0, INDEX_BODY_MAX_CHARS);
  const scope = doc.publication
    ? `${doc.publication.name} ${doc.publication.handle}`
    : `${doc.repository.name} ${doc.repository.slug}`;
  return [doc.title, doc.subtitle, doc.excerpt, tags, scope, body].filter(Boolean).join("\n");
}

export function resolveDocumentVisibility(doc: {
  status: string;
  accessLevel: ContentAccessLevel;
  publication: { visibility: string } | null;
  repository: { visibility: string };
}): ContentIndexVisibility | null {
  if (doc.status !== "PUBLISHED") return null;

  const scopePublic = doc.publication
    ? doc.publication.visibility === "PUBLIC"
    : doc.repository.visibility === "PUBLIC";

  if (!scopePublic) return "PRIVATE";
  if (doc.accessLevel !== "PUBLIC") return "PROTECTED";
  return "PUBLIC";
}

async function loadDocumentForIndex(documentId: string) {
  return prisma.document.findUnique({
    where: { id: documentId },
    select: {
      status: true,
      accessLevel: true,
      title: true,
      subtitle: true,
      excerpt: true,
      content: true,
      publication: { select: { visibility: true, name: true, handle: true } },
      repository: { select: { visibility: true, name: true, slug: true } },
      tags: { include: { tag: { select: { name: true } } } },
    },
  });
}

async function maybeGenerateEmbedding(text: string, contentHash: string, existing?: { contentHash: string; embedding: string | null } | null) {
  if (existing?.contentHash === contentHash && existing.embedding) return existing.embedding;

  const ai = getAiProvider();
  if (!ai.isConfigured()) return null;

  const result = await ai.generateEmbedding({ text });
  if (!result.ok) return null;
  return JSON.stringify(result.data);
}

export async function indexDocument(documentId: string) {
  const doc = await loadDocumentForIndex(documentId);
  if (!doc) return { indexed: false, reason: "not_found" as const };

  const visibility = resolveDocumentVisibility(doc);
  if (!visibility) {
    await removeDocumentIndex(documentId);
    return { indexed: false, reason: "not_indexable" as const };
  }

  const searchableText = buildDocumentIndexText(doc);
  const contentHash = computeContentHash(searchableText);
  const existing = await prisma.contentIndex.findUnique({
    where: { entityType_entityId: { entityType: "DOCUMENT", entityId: documentId } },
    select: { contentHash: true, embedding: true },
  });

  const embedding = await maybeGenerateEmbedding(searchableText, contentHash, existing);

  await prisma.contentIndex.upsert({
    where: { entityType_entityId: { entityType: "DOCUMENT", entityId: documentId } },
    create: {
      entityType: "DOCUMENT",
      entityId: documentId,
      searchableText,
      contentHash,
      embedding,
      visibility,
    },
    update: {
      searchableText,
      contentHash,
      embedding: embedding ?? existing?.embedding ?? null,
      visibility,
      indexedAt: new Date(),
    },
  });

  return { indexed: true, visibility };
}

export async function removeDocumentIndex(documentId: string) {
  await prisma.contentIndex.deleteMany({
    where: { entityType: "DOCUMENT", entityId: documentId },
  });
}

/** Non-blocking index refresh — safe to call from request handlers. */
export function scheduleDocumentIndex(documentId: string) {
  void indexDocument(documentId).catch((err) => {
    console.error("[indexing] document index failed", documentId, err);
  });
}

export async function listPublicDocumentIndexes(limit = 500) {
  return prisma.contentIndex.findMany({
    where: { entityType: "DOCUMENT", visibility: "PUBLIC", embedding: { not: null } },
    select: { entityId: true, embedding: true, contentHash: true },
    take: limit,
    orderBy: { indexedAt: "desc" },
  });
}
