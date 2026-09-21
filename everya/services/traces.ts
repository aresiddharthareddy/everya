import { prisma } from "@/lib/prisma";
import { canViewRepo } from "@/lib/access";
import { getRepositoryTree } from "@/services/repositories";
import type { TreeNode } from "@/types";

/** Trace = Repository in the database. Product alias only. */
export type Trace = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: string;
  ownerId: string;
  owner: { id: string; username: string; name: string | null; image: string | null };
  _count?: { documents: number; followers: number; members: number };
  isPublicationBacked: boolean;
};

export function traceHref(trace: { slug: string; owner: { username: string } }) {
  return `/u/${trace.owner.username}/trace/${trace.slug}`;
}

export function traceDocumentHref(
  trace: { slug: string; owner: { username: string } },
  docSlug: string
) {
  return `${traceHref(trace)}/${docSlug}`;
}

/** Standalone traces only — excludes publication-backed repositories */
export function isStandaloneTrace(repo: { publication?: unknown | null }) {
  return !repo.publication;
}

export async function getTraceByPath(ownerUsername: string, traceSlug: string) {
  const repo = await prisma.repository.findFirst({
    where: {
      slug: traceSlug,
      owner: { username: ownerUsername.replace(/^@/, "") },
      publication: null,
    },
    include: {
      owner: { select: { id: true, username: true, name: true, image: true } },
      _count: { select: { documents: true, followers: true, members: true } },
    },
  });
  if (!repo) return null;
  return toTrace(repo);
}

export async function getTraceTree(traceId: string): Promise<TreeNode[]> {
  return getRepositoryTree(traceId);
}

/** @deprecated Use getTraceByPath — kept for /r/ redirect resolution */
export async function getTraceByLegacyPath(ownerUsername: string, repoSlug: string) {
  const repo = await prisma.repository.findFirst({
    where: {
      slug: repoSlug,
      owner: { username: ownerUsername.replace(/^@/, "") },
      publication: null,
    },
    include: {
      owner: { select: { id: true, username: true, name: true, image: true } },
      _count: { select: { documents: true, followers: true, members: true } },
    },
  });
  if (!repo) return null;
  return toTrace(repo);
}

export function assertCanViewTrace(
  trace: { visibility: string; ownerId: string } | null,
  userId?: string
) {
  if (!trace) return false;
  return canViewRepo(trace, userId);
}

export async function resolveDocumentTrace(documentId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      publicationId: true,
      repository: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          visibility: true,
          ownerId: true,
          owner: { select: { id: true, username: true, name: true, image: true } },
          publication: { select: { id: true } },
          _count: { select: { documents: true, followers: true, members: true } },
        },
      },
    },
  });
  if (!doc || doc.publicationId || !isStandaloneTrace(doc.repository)) return null;
  return toTrace(doc.repository);
}

export async function getDiscoverableTraces(limit = 12) {
  const repos = await prisma.repository.findMany({
    where: { visibility: "PUBLIC", publication: null },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      owner: { select: { username: true, name: true } },
      _count: { select: { documents: true, followers: true } },
    },
  });
  return repos.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    owner: r.owner,
    _count: r._count,
  }));
}

function toTrace(repo: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: string;
  ownerId: string;
  owner: { id: string; username: string; name: string | null; image: string | null };
  _count?: { documents: number; followers: number; members: number };
  publication?: { id: string } | null;
}): Trace {
  return {
    id: repo.id,
    name: repo.name,
    slug: repo.slug,
    description: repo.description,
    visibility: repo.visibility,
    ownerId: repo.ownerId,
    owner: repo.owner,
    _count: repo._count,
    isPublicationBacked: !!repo.publication,
  };
}
