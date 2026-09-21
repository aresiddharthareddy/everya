import { prisma } from "@/lib/prisma";

export async function getCreatorAnalytics(creatorId: string) {
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [views, uniqueReaders, followers, members, subs, premiumDocs, revenue] = await Promise.all([
    prisma.documentView.count({
      where: { createdAt: { gte: since30 }, document: { authorId: creatorId } },
    }),
    prisma.documentView.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: since30 }, document: { authorId: creatorId }, userId: { not: null } },
    }).then((g) => g.length),
    prisma.userFollow.count({ where: { followingId: creatorId } }),
    prisma.creatorMembership.count({ where: { creatorId, status: "ACTIVE" } }),
    prisma.billingSubscription.count({ where: { status: "ACTIVE", plan: { creatorId } } }),
    prisma.document.count({
      where: { authorId: creatorId, accessLevel: { in: ["MEMBERS", "PREMIUM"] }, status: "PUBLISHED" },
    }),
    prisma.creatorRevenue.aggregate({
      where: { creatorId, createdAt: { gte: since30 } },
      _sum: { netCents: true },
    }),
  ]);

  const premiumViews = await prisma.documentView.count({
    where: {
      createdAt: { gte: since30 },
      document: { authorId: creatorId, accessLevel: { in: ["MEMBERS", "PREMIUM"] } },
    },
  });

  return {
    periodDays: 30,
    documentViews: views,
    uniqueReaders,
    followers,
    members,
    activeSubscriptions: subs,
    premiumDocumentCount: premiumDocs,
    premiumContentViews: premiumViews,
    revenueCents30d: revenue._sum.netCents ?? 0,
  };
}
