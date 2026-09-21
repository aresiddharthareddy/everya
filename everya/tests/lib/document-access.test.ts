import { describe, it, expect } from "vitest";
import { canViewRepo } from "@/lib/access";
import { commentParentMatchesDocument } from "@/lib/permissions/document";

describe("document visibility (canViewRepo)", () => {
  const ownerId = "owner-1";

  it("treats ENTERPRISE like PRIVATE until Phase 2 RBAC", () => {
    expect(canViewRepo({ visibility: "ENTERPRISE", ownerId }, undefined)).toBe(false);
    expect(canViewRepo({ visibility: "ENTERPRISE", ownerId }, ownerId)).toBe(true);
    expect(canViewRepo({ visibility: "ENTERPRISE", ownerId }, "other")).toBe(false);
  });
});

describe("commentParentMatchesDocument", () => {
  it("accepts parent on same document", () => {
    expect(commentParentMatchesDocument({ documentId: "doc-1" }, "doc-1")).toBe(true);
  });

  it("rejects parent on different document", () => {
    expect(commentParentMatchesDocument({ documentId: "doc-2" }, "doc-1")).toBe(false);
  });

  it("rejects missing parent", () => {
    expect(commentParentMatchesDocument(null, "doc-1")).toBe(false);
  });
});
