export type CheckoutSessionInput = {
  userId: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutSessionResult =
  | { ok: true; url: string; sessionId: string }
  | { ok: false; code: "NOT_CONFIGURED" | "PLAN_NOT_FOUND" | "ERROR"; message: string };

export type WebhookResult = { handled: boolean; message?: string };

export interface PaymentProvider {
  name: string;
  isConfigured(): boolean;
  createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult>;
  verifyWebhook(payload: string, signature: string): WebhookResult;
  parseWebhookEvent(payload: string): Promise<unknown>;
}
