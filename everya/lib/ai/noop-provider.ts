import type { AiProvider } from "./types";

export class NoopAiProvider implements AiProvider {
  name = "none";

  isConfigured() {
    return false;
  }

  private unavailable() {
    return { ok: false as const, code: "NOT_CONFIGURED" as const, message: "AI provider not configured" };
  }

  async summarize() {
    return this.unavailable();
  }

  async suggestTags() {
    return this.unavailable();
  }

  async generateEmbedding() {
    return this.unavailable();
  }
}
