import { prisma } from "@/lib/prisma";

export async function getWriterStats(userId: string) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [docs, followerRow, totals, recentViews] = await Promise.all([
    prisma.document.findMany({
      where: { authorId: userId },
      include: {
        repository: { select: { slug: true, name: true, owner: { select: { username: true } } } },
        _count: { select: { comments: true, likes: true, ratings: true, views: true } },
        ratings: { select: { value: true } },
      },
      orderBy: { readerCount: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { _count: { select: { followers: true } } },
    }),
    prisma.document.aggregate({
      where: { authorId: userId },
      _sum: { readerCount: true, readingMinutesTotal: true },
      _count: true,
    }),
    prisma.documentView.findMany({
      where: { createdAt: { gte: since }, document: { authorId: userId } },
      select: { createdAt: true },
    }),
  ]);

  const totalLikes = docs.reduce((s, d) => s + d._count.likes, 0);
  const totalComments = docs.reduce((s, d) => s + d._count.comments, 0);
  const allRatings = docs.flatMap((d) => d.ratings);
  const avgRating =
    allRatings.length > 0 ? allRatings.reduce((s, r) => s + r.value, 0) / allRatings.length : 0;

  const byDay = new Map<string, number>();
  for (const v of recentViews) {
    const day = v.createdAt.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + 1);
  }

  const chart: { date: string; label: string; views: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    chart.push({
      date: key,
      label: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
      views: byDay.get(key) || 0,
    });
  }

  const stories = docs.map((d) => ({
    id: d.id,
    title: d.title,
    slug: d.slug,
    readerCount: d.readerCount,
    likeCount: d._count.likes,
    commentCount: d._count.comments,
    ratingCount: d._count.ratings,
    avgRating:
      d.ratings.length > 0
        ? d.ratings.reduce((s, r) => s + r.value, 0) / d.ratings.length
        : 0,
    readingMinutes: d.readingMinutes,
    href: `/r/${d.repository.owner.username}/${d.repository.slug}/${d.slug}`,
    updatedAt: d.updatedAt,
  }));

  const followers = followerRow?._count.followers ?? 0;

  return {
    followers,
    storyCount: totals._count,
    totalReaders: totals._sum.readerCount || 0,
    totalReadMinutes: totals._sum.readingMinutesTotal || 0,
    totalLikes,
    totalComments,
    avgRating,
    chart,
    stories,
  };
}
