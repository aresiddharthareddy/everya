import { prisma } from "@/lib/prisma";

const PLATFORM_FEE_BPS = 1000; // 10%

export function calcPlatformFee(amountCents: number) {
  return Math.floor((amountCents * PLATFORM_FEE_BPS) / 10000);
}

export async function recordSuccessfulPayment(input: {
  userId: string;
  planId: string;
  subscriptionId?: string;
  amountCents: number;
  currency: string;
  provider: string;
  providerPaymentId: string;
  providerEventId: string;
  creatorId: string;
}) {
  const existing = await prisma.paymentTransaction.findUnique({
    where: { providerEventId: input.providerEventId },
  });
  if (existing) return existing;

  const platformFee = calcPlatformFee(input.amountCents);
  const creatorAmount = input.amountCents - platformFee;

  const tx = await prisma.paymentTransaction.create({
    data: {
      userId: input.userId,
      planId: input.planId,
      subscriptionId: input.subscriptionId,
      amountCents: input.amountCents,
      currency: input.currency,
      platformFeeCents: platformFee,
      creatorAmountCents: creatorAmount,
      status: "SUCCEEDED",
      provider: input.provider,
      providerPaymentId: input.providerPaymentId,
      providerEventId: input.providerEventId,
    },
  });

  await prisma.creatorRevenue.create({
    data: {
      creatorId: input.creatorId,
      transactionId: tx.id,
      grossCents: input.amountCents,
      platformFeeCents: platformFee,
      netCents: creatorAmount,
      status: "AVAILABLE",
    },
  });

  await prisma.creatorPayoutBalance.upsert({
    where: { creatorId: input.creatorId },
    create: {
      creatorId: input.creatorId,
      availableCents: creatorAmount,
      pendingCents: 0,
      totalPaidCents: 0,
    },
    update: { availableCents: { increment: creatorAmount } },
  });

  return tx;
}

export async function getCreatorRevenueSummary(creatorId: string) {
  const [revenue, balance, recent] = await Promise.all([
    prisma.creatorRevenue.aggregate({
      where: { creatorId },
      _sum: { grossCents: true, netCents: true, platformFeeCents: true },
    }),
    prisma.creatorPayoutBalance.findUnique({ where: { creatorId } }),
    prisma.creatorRevenue.findMany({
      where: { creatorId },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { transaction: { select: { currency: true, createdAt: true } } },
    }),
  ]);

  return {
    totals: {
      grossCents: revenue._sum.grossCents ?? 0,
      netCents: revenue._sum.netCents ?? 0,
      platformFeeCents: revenue._sum.platformFeeCents ?? 0,
    },
    balance: balance ?? { availableCents: 0, pendingCents: 0, totalPaidCents: 0 },
    recent,
  };
}
