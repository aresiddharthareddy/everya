import { describe, it, expect } from "vitest";
import { calcPlatformFee } from "@/services/revenue";

describe("calcPlatformFee", () => {
  it("applies 10% platform fee", () => {
    expect(calcPlatformFee(1000)).toBe(100);
    expect(calcPlatformFee(1500)).toBe(150);
  });
});
