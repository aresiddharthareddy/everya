import type { CheckoutSessionInput, CheckoutSessionResult, PaymentProvider, WebhookResult } from "./types";
import { prisma } from "@/lib/prisma";

export class StripePaymentProvider implements PaymentProvider {
  name = "stripe";

  isConfigured() {
    return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
  }

  async createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult> {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        ok: false,
        code: "NOT_CONFIGURED",
        message: "STRIPE_SECRET_KEY is not set. Configure Stripe env vars to enable checkout.",
      };
    }

    const plan = await prisma.membershipPlan.findFirst({
      where: { id: input.planId, active: true },
    });
    if (!plan) return { ok: false, code: "PLAN_NOT_FOUND", message: "Plan not found" };

    const sub = await prisma.billingSubscription.create({
      data: { userId: input.userId, planId: plan.id, status: "CREATED", provider: "stripe" },
    });

    // Real Stripe SDK integration point — requires stripe package + credentials
    return {
      ok: false,
      code: "NOT_CONFIGURED",
      message: `Stripe checkout pending SDK wiring. Subscription ${sub.id} created in CREATED state.`,
    };
  }

  verifyWebhook(_payload: string, signature: string): WebhookResult {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return { handled: false, message: "STRIPE_WEBHOOK_SECRET not configured" };
    }
    if (!signature) return { handled: false, message: "Missing signature" };
    return { handled: true };
  }

  async parseWebhookEvent(payload: string) {
    return JSON.parse(payload);
  }
}
