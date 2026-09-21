import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const tab = req.nextUrl.searchParams.get("tab") || "trending";
  const tag = req.nextUrl.searchParams.get("tag");
  const limit = Math.min(50, Number(req.nextUrl.searchParams.get("limit") || 24));

  const session = await auth.api.getSession({ headers: await headers() });
  const tagFilter = tag
    ? { tags: { some: { tag: { slug: tag } } } }
    : {};

  let where: Record<string, unknown> = {
    repository: { visibility: "PUBLIC" },
    ...tagFilter,
  };

  if (tab === "following") {
    if (!session?.user) {
      return NextResponse.json({ stories: [], requiresAuth: true });
    }
    const following = await prisma.userFollow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });
    const ids = following.map((f) => f.followingId);
    if (!ids.length) return NextResponse.json({ stories: [] });
    where = { ...where, authorId: { in: ids } };
  }

  const orderBy =
    tab === "latest"
      ? { updatedAt: "desc" as const }
      : tab === "following"
        ? { updatedAt: "desc" as const }
        : { readerCount: "desc" as const };

  const docs = await prisma.document.findMany({
    where,
    orderBy,
    take: limit,
    include: {
      author: { select: { username: true, name: true } },
      repository: { select: { name: true, slug: true, owner: { select: { username: true } } } },
      tags: { include: { tag: { select: { name: true, slug: true } } } },
    },
  });

  return NextResponse.json({
    stories: docs.map((d) => ({
      id: d.id,
      title: d.title,
      slug: d.slug,
      excerpt: d.excerpt,
      readingMinutes: d.readingMinutes,
      readerCount: d.readerCount,
      author: d.author,
      repository: d.repository,
      tags: d.tags.map((t) => t.tag),
      href: `/r/${d.repository.owner.username}/${d.repository.slug}/${d.slug}`,
    })),
  });
}
