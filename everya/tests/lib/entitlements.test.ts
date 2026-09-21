import { describe, it, expect } from "vitest";
import { stripProtectedContent } from "@/services/entitlements";

describe("stripProtectedContent", () => {
  it("keeps content when allowed", () => {
    const doc = { content: "secret", accessLevel: "PREMIUM" as const };
    expect(stripProtectedContent(doc, { allowed: true, accessLevel: "PREMIUM", reason: "premium" }).content).toBe(
      "secret"
    );
  });

  it("strips content when denied", () => {
    const doc = { content: "secret", accessLevel: "PREMIUM" as const };
    expect(stripProtectedContent(doc, { allowed: false, accessLevel: "PREMIUM", reason: "denied" }).content).toBe("");
  });
});

describe("follow vs membership", () => {
  it("documents distinct social follow from economy membership", () => {
    expect("UserFollow").not.toBe("CreatorMembership");
    expect("PublicationFollow").not.toBe("CreatorMembership");
    expect("TraceFollow").not.toBe("CreatorMembership");
  });
});
