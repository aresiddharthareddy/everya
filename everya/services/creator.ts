import { prisma } from "@/lib/prisma";
import { getWriterStats } from "@/services/stats";

export type CreatorLink = { label: string; url: string };

export async function getCreatorProfile(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      website: true,
      image: true,
      createdAt: true,
      creatorProfile: true,
      _count: {
        select: {
          followers: true,
          ownedPublications: true,
          repositories: true,
          documents: { where: { status: "PUBLISHED" } },
        },
      },
    },
  });
  if (!user) return null;

  const [memberCount, subscriptionCount] = await Promise.all([
    prisma.creatorMembership.count({ where: { creatorId: user.id, status: "ACTIVE" } }),
    prisma.billingSubscription.count({
      where: { status: "ACTIVE", plan: { creatorId: user.id } },
    }),
  ]);

  const links: CreatorLink[] = user.creatorProfile?.links
    ? JSON.parse(user.creatorProfile.links)
    : user.website
      ? [{ label: "Website", url: user.website }]
      : [];

  return {
    ...user,
    tagline: user.creatorProfile?.tagline ?? null,
    links,
    isCreator: user.creatorProfile?.isCreator ?? true,
    stats: {
      followers: user._count.followers,
      publications: user._count.ownedPublications,
      traces: user._count.repositories,
      publishedDocuments: user._count.documents,
      members: memberCount,
      activeSubscriptions: subscriptionCount,
    },
  };
}

export async function upsertCreatorProfile(
  userId: string,
  data: { tagline?: string | null; links?: CreatorLink[]; isCreator?: boolean }
) {
  return prisma.creatorProfile.upsert({
    where: { userId },
    create: {
      userId,
      tagline: data.tagline ?? null,
      links: data.links ? JSON.stringify(data.links) : null,
      isCreator: data.isCreator ?? true,
    },
    update: {
      tagline: data.tagline ?? null,
      links: data.links ? JSON.stringify(data.links) : null,
      isCreator: data.isCreator,
    },
  });
}

export async function getCreatorDashboard(userId: string) {
  const [writerStats, publications, traces, memberCount, subs, revenue, balance, plans] =
    await Promise.all([
      getWriterStats(userId),
      prisma.publication.findMany({
        where: { ownerId: userId },
        select: { id: true, name: true, handle: true, _count: { select: { followers: true, articles: true } } },
      }),
      prisma.repository.findMany({
        where: { ownerId: userId, publication: null },
        select: { id: true, name: true, slug: true, _count: { select: { documents: true, followers: true } } },
      }),
      prisma.creatorMembership.count({ where: { creatorId: userId, status: "ACTIVE" } }),
      prisma.billingSubscription.count({ where: { status: "ACTIVE", plan: { creatorId: userId } } }),
      prisma.creatorRevenue.aggregate({
        where: { creatorId: userId, status: { in: ["AVAILABLE", "PAID"] } },
        _sum: { netCents: true, grossCents: true },
      }),
      prisma.creatorPayoutBalance.findUnique({ where: { creatorId: userId } }),
      prisma.membershipPlan.count({ where: { creatorId: userId, active: true } }),
    ]);

  return {
    writerStats,
    publications,
    traces,
    economy: {
      members: memberCount,
      activeSubscriptions: subs,
      activePlans: plans,
      totalRevenueCents: revenue._sum.netCents ?? 0,
      grossRevenueCents: revenue._sum.grossCents ?? 0,
      payout: balance ?? { availableCents: 0, pendingCents: 0, totalPaidCents: 0 },
    },
  };
}
