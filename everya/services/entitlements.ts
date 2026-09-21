import { prisma } from "@/lib/prisma";
import type { ContentAccessLevel, MembershipPlanTier } from "@prisma/client";

export type EntitlementResult = {
  allowed: boolean;
  accessLevel: ContentAccessLevel;
  reason?: "public" | "editor" | "membership" | "premium" | "denied";
};

type DocScope = {
  id: string;
  accessLevel: ContentAccessLevel;
  authorId: string;
  publicationId: string | null;
  repositoryId: string;
  repository: { ownerId: string; visibility: string };
};

function tierSatisfies(required: ContentAccessLevel, tier: MembershipPlanTier) {
  if (required === "MEMBERS") return true;
  return tier === "PREMIUM";
}

async function activeMembership(
  userId: string,
  scope: { publicationId?: string | null; repositoryId?: string; creatorId: string },
  minTier: ContentAccessLevel
) {
  const now = new Date();
  const memberships = await prisma.creatorMembership.findMany({
    where: {
      userId,
      creatorId: scope.creatorId,
      status: "ACTIVE",
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      AND: [
        scope.publicationId
          ? { OR: [{ publicationId: scope.publicationId }, { publicationId: null, repositoryId: null }] }
          : {},
        scope.repositoryId && !scope.publicationId
          ? { OR: [{ repositoryId: scope.repositoryId }, { repositoryId: null, publicationId: null }] }
          : {},
      ],
    },
    include: { plan: { select: { tier: true } } },
  });

  return memberships.some((m) => {
    const tier = m.plan?.tier ?? "MEMBER";
    return tierSatisfies(minTier, tier);
  });
}

async function activePremiumSubscription(userId: string, planIds: string[]) {
  if (!planIds.length) return false;
  const now = new Date();
  const sub = await prisma.billingSubscription.findFirst({
    where: {
      userId,
      planId: { in: planIds },
      status: "ACTIVE",
      OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: now } }],
    },
  });
  return !!sub;
}

export async function checkContentEntitlement(
  doc: DocScope,
  userId?: string,
  opts?: { traceEditor?: boolean; publicationRole?: boolean }
): Promise<EntitlementResult> {
  if (doc.accessLevel === "PUBLIC") {
    return { allowed: true, accessLevel: "PUBLIC", reason: "public" };
  }
  if (!userId) return { allowed: false, accessLevel: doc.accessLevel, reason: "denied" };

  if (doc.authorId === userId || opts?.traceEditor || opts?.publicationRole) {
    return { allowed: true, accessLevel: doc.accessLevel, reason: "editor" };
  }

  const creatorId = doc.repository.ownerId;
  const memberOk = await activeMembership(userId, {
    creatorId,
    publicationId: doc.publicationId,
    repositoryId: doc.repositoryId,
  }, doc.accessLevel === "PREMIUM" ? "PREMIUM" : "MEMBERS");

  if (memberOk) {
    return {
      allowed: true,
      accessLevel: doc.accessLevel,
      reason: doc.accessLevel === "PREMIUM" ? "premium" : "membership",
    };
  }

  if (doc.accessLevel === "PREMIUM") {
    const plans = await prisma.membershipPlan.findMany({
      where: {
        creatorId,
        active: true,
        tier: "PREMIUM",
        OR: [
          doc.publicationId ? { publicationId: doc.publicationId } : { repositoryId: doc.repositoryId },
        ],
      },
      select: { id: true },
    });
    if (await activePremiumSubscription(userId, plans.map((p) => p.id))) {
      return { allowed: true, accessLevel: "PREMIUM", reason: "premium" };
    }
  }

  return { allowed: false, accessLevel: doc.accessLevel, reason: "denied" };
}

export function stripProtectedContent<T extends { content?: string; accessLevel?: ContentAccessLevel }>(
  doc: T,
  entitlement: EntitlementResult
): T {
  if (entitlement.allowed) return doc;
  return { ...doc, content: "" };
}
