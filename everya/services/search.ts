import { prisma } from "@/lib/prisma";
import type { SearchResult } from "@/types";

export async function searchAll(
  query: string,
  opts?: { type?: "all" | "articles" | "authors" | "publications"; limit?: number }
): Promise<SearchResult[]> {
  const q = query.trim();
  const limit = opts?.limit ?? 20;
  if (!q || q.length < 2) return [];

  const type = opts?.type ?? "all";
  const results: SearchResult[] = [];

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
      }))
    );
  }

  if (type === "all" || type === "articles") {
    const documents = await prisma.document.findMany({
      where: {
        status: "PUBLISHED",
        AND: [
          {
            OR: [
              { title: { contains: q } },
              { subtitle: { contains: q } },
              { content: { contains: q } },
              { excerpt: { contains: q } },
            ],
          },
          {
            OR: [
              { publication: { visibility: "PUBLIC" } },
              { publicationId: null, repository: { visibility: "PUBLIC" } },
            ],
          },
        ],
      },
      take: limit,
      include: {
        publication: { select: { handle: true, name: true } },
        repository: { select: { slug: true, name: true, owner: { select: { username: true } } } },
        _count: { select: { linksFrom: true, linksTo: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    results.push(
      ...documents.map((d) => ({
        type: "document" as const,
        id: d.id,
        title: d.title,
        subtitle: d.publication
          ? `${d.publication.name} · @${d.publication.handle} · ${d._count.linksFrom + d._count.linksTo} links`
          : `${d.repository.name} · @${d.repository.owner.username} · ${d._count.linksFrom + d._count.linksTo} links`,
        href: d.publication
          ? `/p/${d.publication.handle}/${d.slug}`
          : `/u/${d.repository.owner.username}/trace/${d.repository.slug}/${d.slug}`,
      }))
    );
  }

  return results.slice(0, limit);
}
