import { StripePaymentProvider } from "./stripe-provider";
import type { PaymentProvider } from "./types";

let provider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (!provider) provider = new StripePaymentProvider();
  return provider;
}

export function isPaymentConfigured() {
  return getPaymentProvider().isConfigured();
}

export * from "./types";
