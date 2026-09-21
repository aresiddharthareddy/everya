import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, resetRateLimits } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => resetRateLimits());

  it("allows requests under the limit", () => {
    const r1 = rateLimit({ key: "test", limit: 3, windowMs: 60_000 });
    const r2 = rateLimit({ key: "test", limit: 3, windowMs: 60_000 });
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
  });

  it("blocks when limit exceeded", () => {
    rateLimit({ key: "block", limit: 2, windowMs: 60_000 });
    rateLimit({ key: "block", limit: 2, windowMs: 60_000 });
    const r3 = rateLimit({ key: "block", limit: 2, windowMs: 60_000 });
    expect(r3.ok).toBe(false);
    if (!r3.ok) expect(r3.retryAfterMs).toBeGreaterThan(0);
  });
});
