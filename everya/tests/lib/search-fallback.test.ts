import { describe, it, expect } from "vitest";
import { isAiConfigured } from "@/lib/ai";

describe("search without AI provider", () => {
  it("reports AI as not configured", () => {
    expect(isAiConfigured()).toBe(false);
  });
});
