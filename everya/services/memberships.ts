import { prisma } from "@/lib/prisma";
import type { MembershipPlanTier } from "@prisma/client";

export async function listCreatorPlans(creatorId: string) {
  return prisma.membershipPlan.findMany({
    where: { creatorId },
    include: {
      publication: { select: { handle: true, name: true } },
      repository: { select: { slug: true, name: true, owner: { select: { username: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listPlansForScope(scope: {
  publicationId?: string;
  repositoryId?: string;
  creatorId?: string;
}) {
  return prisma.membershipPlan.findMany({
    where: {
      active: true,
      ...(scope.creatorId ? { creatorId: scope.creatorId } : {}),
      ...(scope.publicationId ? { publicationId: scope.publicationId } : {}),
      ...(scope.repositoryId ? { repositoryId: scope.repositoryId } : {}),
    },
    orderBy: { priceCents: "asc" },
  });
}

export async function createMembershipPlan(
  creatorId: string,
  input: {
    name: string;
    description?: string;
    tier?: MembershipPlanTier;
    priceCents: number;
    currency?: string;
    interval?: string;
    publicationId?: string;
    repositoryId?: string;
  }
) {
  if (input.publicationId) {
    const pub = await prisma.publication.findFirst({
      where: { id: input.publicationId, ownerId: creatorId },
    });
    if (!pub) return null;
  }
  if (input.repositoryId) {
    const repo = await prisma.repository.findFirst({
      where: { id: input.repositoryId, ownerId: creatorId },
    });
    if (!repo) return null;
  }

  return prisma.membershipPlan.create({
    data: {
      creatorId,
      name: input.name,
      description: input.description,
      tier: input.tier ?? "MEMBER",
      priceCents: input.priceCents,
      currency: input.currency ?? "USD",
      interval: input.interval ?? "month",
      publicationId: input.publicationId,
      repositoryId: input.repositoryId,
    },
  });
}

export async function grantMembership(input: {
  userId: string;
  creatorId: string;
  planId?: string;
  publicationId?: string;
  repositoryId?: string;
  endsAt?: Date;
}) {
  const existing = input.publicationId
    ? await prisma.creatorMembership.findUnique({
        where: { userId_publicationId: { userId: input.userId, publicationId: input.publicationId } },
      })
    : input.repositoryId
      ? await prisma.creatorMembership.findUnique({
          where: { userId_repositoryId: { userId: input.userId, repositoryId: input.repositoryId } },
        })
      : null;

  if (existing) {
    return prisma.creatorMembership.update({
      where: { id: existing.id },
      data: { status: "ACTIVE", planId: input.planId, endsAt: input.endsAt ?? null },
    });
  }

  return prisma.creatorMembership.create({
    data: {
      userId: input.userId,
      creatorId: input.creatorId,
      planId: input.planId,
      publicationId: input.publicationId,
      repositoryId: input.repositoryId,
      status: "ACTIVE",
      endsAt: input.endsAt,
    },
  });
}

export async function listUserMemberships(userId: string) {
  return prisma.creatorMembership.findMany({
    where: { userId },
    include: {
      plan: true,
      creator: { select: { username: true, name: true, image: true } },
      publication: { select: { handle: true, name: true } },
      repository: { select: { slug: true, name: true, owner: { select: { username: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function expireStaleMemberships() {
  const now = new Date();
  await prisma.creatorMembership.updateMany({
    where: { status: "ACTIVE", endsAt: { lt: now } },
    data: { status: "EXPIRED" },
  });
}
