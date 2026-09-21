import type { TraceRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canViewRepo } from "@/lib/access";
import {
  canEditTraceContent,
  canManageTraceMembers,
  getTraceRole,
} from "@/lib/permissions/trace";
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

export async function getTraceTree(
  traceId: string,
  options?: { includeDrafts?: boolean }
): Promise<TreeNode[]> {
  return getRepositoryTree(traceId, options);
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

export async function assertCanViewTrace(
  trace: { id: string; visibility: string; ownerId: string } | null,
  userId?: string
) {
  if (!trace) return false;
  if (canViewRepo(trace, userId)) return true;
  if (!userId) return false;
  const member = await prisma.traceMember.findUnique({
    where: { repositoryId_userId: { repositoryId: trace.id, userId } },
  });
  return !!member;
}

export async function loadStandaloneTrace(username: string, slug: string) {
  return prisma.repository.findFirst({
    where: {
      slug,
      publication: null,
      owner: { username: username.replace(/^@/, "") },
    },
    include: { owner: { select: { id: true, username: true } } },
  });
}

export async function getTraceMembers(repositoryId: string) {
  return prisma.traceMember.findMany({
    where: { repositoryId },
    include: {
      user: { select: { id: true, username: true, name: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function addTraceMember(
  repositoryId: string,
  actorId: string,
  targetUserId: string,
  role: TraceRole
) {
  const actorRole = await getTraceRole(repositoryId, actorId);
  if (!actorRole || !canManageTraceMembers(actorRole)) return { error: "forbidden" as const };

  const existing = await prisma.traceMember.findUnique({
    where: { repositoryId_userId: { repositoryId, userId: targetUserId } },
  });
  if (existing) return { error: "exists" as const };
  if (targetUserId === actorId && actorRole === "OWNER") return { error: "invalid" as const };

  await prisma.traceMember.create({ data: { repositoryId, userId: targetUserId, role } });
  return { ok: true as const };
}

export async function updateTraceMemberRole(
  repositoryId: string,
  actorId: string,
  targetUserId: string,
  role: TraceRole
) {
  const actorRole = await getTraceRole(repositoryId, actorId);
  if (!actorRole || !canManageTraceMembers(actorRole)) return { error: "forbidden" as const };

  const target = await prisma.traceMember.findUnique({
    where: { repositoryId_userId: { repositoryId, userId: targetUserId } },
  });
  if (!target) return { error: "not_found" as const };

  await prisma.traceMember.update({
    where: { repositoryId_userId: { repositoryId, userId: targetUserId } },
    data: { role },
  });
  return { ok: true as const };
}

export async function removeTraceMember(repositoryId: string, actorId: string, targetUserId: string) {
  const actorRole = await getTraceRole(repositoryId, actorId);
  if (!actorRole || !canManageTraceMembers(actorRole)) return { error: "forbidden" as const };

  const target = await prisma.traceMember.findUnique({
    where: { repositoryId_userId: { repositoryId, userId: targetUserId } },
  });
  if (!target) return { error: "not_found" as const };

  await prisma.traceMember.delete({
    where: { repositoryId_userId: { repositoryId, userId: targetUserId } },
  });
  return { ok: true as const };
}

export async function canEditTrace(repositoryId: string, userId: string) {
  const role = await getTraceRole(repositoryId, userId);
  return !!role && canEditTraceContent(role);
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
