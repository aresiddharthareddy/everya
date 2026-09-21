import { describe, it, expect } from "vitest";
import { buildTraceExport } from "@/lib/trace-export";

describe("buildTraceExport", () => {
  it("returns null for missing repository", async () => {
    const result = await buildTraceExport("nonexistent-id");
    expect(result).toBeNull();
  });
});
