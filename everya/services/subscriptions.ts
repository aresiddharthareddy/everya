import { prisma } from "@/lib/prisma";
import type { BillingSubscriptionStatus } from "@prisma/client";

export async function createSubscription(userId: string, planId: string) {
  const plan = await prisma.membershipPlan.findFirst({ where: { id: planId, active: true } });
  if (!plan) return null;

  return prisma.billingSubscription.create({
    data: { userId, planId, status: "CREATED" },
    include: { plan: true },
  });
}

export async function activateSubscription(
  id: string,
  data: {
    provider: string;
    providerSubscriptionId: string;
    providerCustomerId?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
  }
) {
  const sub = await prisma.billingSubscription.update({
    where: { id },
    data: {
      status: "ACTIVE",
      provider: data.provider,
      providerSubscriptionId: data.providerSubscriptionId,
      providerCustomerId: data.providerCustomerId,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
    },
    include: { plan: true, user: { select: { id: true } } },
  });

  await prisma.creatorMembership.upsert({
    where: sub.plan.publicationId
      ? { userId_publicationId: { userId: sub.userId, publicationId: sub.plan.publicationId } }
      : { userId_repositoryId: { userId: sub.userId, repositoryId: sub.plan.repositoryId! } },
    create: {
      userId: sub.userId,
      creatorId: sub.plan.creatorId,
      planId: sub.planId,
      publicationId: sub.plan.publicationId,
      repositoryId: sub.plan.repositoryId,
      status: "ACTIVE",
      endsAt: data.currentPeriodEnd,
    },
    update: {
      status: "ACTIVE",
      planId: sub.planId,
      endsAt: data.currentPeriodEnd,
    },
  });

  return sub;
}

export async function cancelSubscription(id: string, userId: string) {
  const sub = await prisma.billingSubscription.findFirst({
    where: { id, userId },
    include: { plan: true },
  });
  if (!sub) return null;

  return prisma.billingSubscription.update({
    where: { id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
}

export async function updateSubscriptionStatus(
  providerSubscriptionId: string,
  status: BillingSubscriptionStatus,
  periodEnd?: Date
) {
  const sub = await prisma.billingSubscription.findUnique({
    where: { providerSubscriptionId },
    include: { plan: true },
  });
  if (!sub) return null;

  const updated = await prisma.billingSubscription.update({
    where: { id: sub.id },
    data: {
      status,
      currentPeriodEnd: periodEnd ?? sub.currentPeriodEnd,
      cancelledAt: status === "CANCELLED" ? new Date() : sub.cancelledAt,
    },
  });

  if (status === "EXPIRED" || status === "CANCELLED") {
    const membershipWhere = sub.plan.publicationId
      ? { userId: sub.userId, publicationId: sub.plan.publicationId }
      : { userId: sub.userId, repositoryId: sub.plan.repositoryId };
    await prisma.creatorMembership.updateMany({
      where: membershipWhere,
      data: { status: status === "EXPIRED" ? "EXPIRED" : "CANCELLED" },
    });
  }

  return updated;
}

export async function listUserSubscriptions(userId: string) {
  return prisma.billingSubscription.findMany({
    where: { userId },
    include: {
      plan: {
        include: {
          creator: { select: { username: true, name: true } },
          publication: { select: { handle: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
