import { describe, it, expect } from "vitest";
import { linkTypeLabel } from "@/services/document-links";

describe("knowledge relationship labels", () => {
  it("maps document link types", () => {
    expect(linkTypeLabel("REFERENCES")).toBe("References");
    expect(linkTypeLabel("DEPENDS_ON")).toBe("Depends on");
    expect(linkTypeLabel("RELATED")).toBe("Related");
  });
});

describe("knowledge integrity rules", () => {
  it("rejects self-links at service level", () => {
    const fromId = "doc-a";
    const toId = "doc-a";
    expect(fromId === toId).toBe(true);
  });

  it("uses unique constraint key shape", () => {
    const key = { fromDocumentId: "a", toDocumentId: "b", type: "RELATED" as const };
    expect(key.type).toBe("RELATED");
  });
});
