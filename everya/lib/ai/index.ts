import { NoopAiProvider } from "./noop-provider";
import type { AiProvider } from "./types";

let provider: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (!provider) provider = new NoopAiProvider();
  return provider;
}

export function isAiConfigured() {
  return getAiProvider().isConfigured();
}

export * from "./types";
