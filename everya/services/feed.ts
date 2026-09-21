import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const publishedPublic: Prisma.DocumentWhereInput = {
  status: "PUBLISHED",
  OR: [
    { publication: { visibility: "PUBLIC" } },
    { publicationId: null, repository: { visibility: "PUBLIC" } },
  ],
};

export async function getLatestFeed(userId?: string, cursor?: string, limit = 20) {
  const where: Prisma.DocumentWhereInput = publishedPublic;
  return prisma.document.findMany({
    where: cursor ? { ...where, id: { lt: cursor } } : where,
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: limit,
    include: feedInclude(userId),
  });
}

export async function getTrendingFeed(userId?: string, limit = 20) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return prisma.document.findMany({
    where: {
      ...publishedPublic,
      updatedAt: { gte: since },
    },
    orderBy: [{ readerCount: "desc" }, { updatedAt: "desc" }],
    take: limit,
    include: feedInclude(userId),
  });
}

export async function getFollowingFeed(userId: string, limit = 20) {
  const [followingUsers, followingPubs] = await Promise.all([
    prisma.userFollow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
    prisma.publicationFollow.findMany({ where: { userId }, select: { publicationId: true } }),
  ]);
  const authorIds = followingUsers.map((f) => f.followingId);
  const pubIds = followingPubs.map((f) => f.publicationId);
  if (!authorIds.length && !pubIds.length) return [];

  return prisma.document.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        authorIds.length ? { authorId: { in: authorIds } } : undefined,
        pubIds.length ? { publicationId: { in: pubIds } } : undefined,
      ].filter(Boolean) as Prisma.DocumentWhereInput[],
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: limit,
    include: feedInclude(userId),
  });
}

export async function getForYouFeed(userId: string, limit = 20) {
  const [followingUsers, followingPubs, bookmarks, progress] = await Promise.all([
    prisma.userFollow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
    prisma.publicationFollow.findMany({ where: { userId }, select: { publicationId: true } }),
    prisma.bookmark.findMany({ where: { userId }, select: { document: { select: { authorId: true, publicationId: true } } }, take: 10 }),
    prisma.readingProgress.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 10, select: { document: { select: { authorId: true, publicationId: true } } } }),
  ]);

  const authorIds = new Set<string>();
  const pubIds = new Set<string>();
  for (const f of followingUsers) authorIds.add(f.followingId);
  for (const f of followingPubs) pubIds.add(f.publicationId);
  for (const b of bookmarks) {
    authorIds.add(b.document.authorId);
    if (b.document.publicationId) pubIds.add(b.document.publicationId);
  }
  for (const p of progress) {
    authorIds.add(p.document.authorId);
    if (p.document.publicationId) pubIds.add(p.document.publicationId);
  }

  if (!authorIds.size && !pubIds.size) {
    return getTrendingFeed(userId, limit);
  }

  const docs = await prisma.document.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        authorIds.size ? { authorId: { in: [...authorIds] } } : undefined,
        pubIds.size ? { publicationId: { in: [...pubIds] } } : undefined,
      ].filter(Boolean) as Prisma.DocumentWhereInput[],
    },
    orderBy: [{ publishedAt: "desc" }, { readerCount: "desc" }],
    take: limit * 2,
    include: feedInclude(userId),
  });

  const seen = new Set<string>();
  const ranked = docs
    .map((d) => ({
      doc: d,
      score:
        (authorIds.has(d.authorId) ? 3 : 0) +
        (d.publicationId && pubIds.has(d.publicationId) ? 2 : 0) +
        Math.min(d.readerCount / 1000, 2),
    }))
    .sort((a, b) => b.score - a.score);

  const out = [];
  for (const { doc } of ranked) {
    if (seen.has(doc.id)) continue;
    seen.add(doc.id);
    out.push(doc);
    if (out.length >= limit) break;
  }
  return out;
}

function feedInclude(_userId?: string) {
  return {
    author: { select: { id: true, username: true, name: true, image: true } },
    publication: { select: { id: true, name: true, handle: true, logo: true } },
    repository: { select: { slug: true, name: true, owner: { select: { username: true } } } },
    tags: { include: { tag: { select: { name: true, slug: true } } } },
    ratings: { select: { value: true } },
    _count: { select: { likes: true, comments: true } },
  };
}

export function articleHref(doc: {
  slug: string;
  publication?: { handle: string } | null;
  repository: { slug: string; owner: { username: string } };
}) {
  if (doc.publication) return `/p/${doc.publication.handle}/${doc.slug}`;
  return `/u/${doc.repository.owner.username}/trace/${doc.repository.slug}/${doc.slug}`;
}
