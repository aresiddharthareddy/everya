import { NextRequest } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { recordSuccessfulPayment } from "@/services/revenue";
import { activateSubscription } from "@/services/subscriptions";
import { prisma } from "@/lib/prisma";
import { badRequest, jsonData } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") || "";

  const provider = getPaymentProvider();
  const verified = provider.verifyWebhook(payload, signature);
  if (!verified.handled) return badRequest(verified.message || "Webhook verification failed");

  const event = await provider.parseWebhookEvent(payload) as {
    id: string;
    type: string;
    data: { object: Record<string, unknown> };
  };

  if (event.type === "checkout.session.completed") {
    const obj = event.data.object;
    const subscriptionId = String(obj.subscription || obj.client_reference_id || "");
    const sub = await prisma.billingSubscription.findFirst({
      where: { OR: [{ id: subscriptionId }, { providerSubscriptionId: subscriptionId }] },
      include: { plan: true },
    });
    if (sub) {
      await activateSubscription(sub.id, {
        provider: "stripe",
        providerSubscriptionId: String(obj.subscription || sub.id),
        providerCustomerId: String(obj.customer || ""),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      await recordSuccessfulPayment({
        userId: sub.userId,
        planId: sub.planId,
        subscriptionId: sub.id,
        amountCents: sub.plan.priceCents,
        currency: sub.plan.currency,
        provider: "stripe",
        providerPaymentId: String(obj.payment_intent || event.id),
        providerEventId: event.id,
        creatorId: sub.plan.creatorId,
      });
    }
  }

  return jsonData({ received: true });
}
