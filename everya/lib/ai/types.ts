export type AiResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: "NOT_CONFIGURED" | "RATE_LIMITED" | "ERROR"; message: string };

export interface AiProvider {
  name: string;
  isConfigured(): boolean;
  summarize(input: { text: string; maxPoints?: number }): Promise<AiResult<string>>;
  suggestTags(input: { title: string; text: string; existing: string[] }): Promise<AiResult<string[]>>;
  generateEmbedding(input: { text: string }): Promise<AiResult<number[]>>;
}
