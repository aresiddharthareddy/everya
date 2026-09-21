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
      },
      orderBy: { updatedAt: "desc" },
    });
    results.push(
      ...documents.map((d) => ({
        type: "document" as const,
        id: d.id,
        title: d.title,
        subtitle: d.publication
          ? `${d.publication.name} · @${d.publication.handle}`
          : `${d.repository.name} · @${d.repository.owner.username}`,
        href: d.publication
          ? `/p/${d.publication.handle}/${d.slug}`
          : `/r/${d.repository.owner.username}/${d.repository.slug}/${d.slug}`,
      }))
    );
  }

  return results.slice(0, limit);
}
