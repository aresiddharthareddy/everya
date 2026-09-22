import { describe, it, expect } from "vitest";
import {
  buildDocumentIndexText,
  computeContentHash,
  resolveDocumentVisibility,
  INDEX_BODY_MAX_CHARS,
} from "@/services/indexing";

const baseDoc = {
  status: "PUBLISHED",
  accessLevel: "PUBLIC" as const,
  title: "Kubernetes Networking",
  subtitle: "Fundamentals",
  excerpt: "How pods communicate",
  content: "Containers share a network namespace.",
  publication: null,
  repository: { visibility: "PUBLIC", name: "Platform Docs", slug: "platform-docs" },
  tags: [{ tag: { name: "kubernetes" } }, { tag: { name: "networking" } }],
};

describe("indexing visibility", () => {
  it("indexes public published documents as PUBLIC", () => {
    expect(resolveDocumentVisibility(baseDoc)).toBe("PUBLIC");
  });

  it("marks members-only published docs as PROTECTED", () => {
    expect(resolveDocumentVisibility({ ...baseDoc, accessLevel: "MEMBERS" })).toBe("PROTECTED");
  });

  it("marks private trace docs as PRIVATE", () => {
    expect(
      resolveDocumentVisibility({
        ...baseDoc,
        repository: { visibility: "PRIVATE" },
      })
    ).toBe("PRIVATE");
  });

  it("skips drafts and archived docs", () => {
    expect(resolveDocumentVisibility({ ...baseDoc, status: "DRAFT" })).toBeNull();
    expect(resolveDocumentVisibility({ ...baseDoc, status: "ARCHIVED" })).toBeNull();
  });
});

describe("indexing text", () => {
  it("includes title, tags, and scope metadata", () => {
    const text = buildDocumentIndexText(baseDoc);
    expect(text).toContain("Kubernetes Networking");
    expect(text).toContain("kubernetes");
    expect(text).toContain("platform-docs");
  });

  it("caps body length", () => {
    const text = buildDocumentIndexText({ ...baseDoc, content: "x".repeat(INDEX_BODY_MAX_CHARS + 500) });
    expect(text.length).toBeLessThan(INDEX_BODY_MAX_CHARS + 200);
  });

  it("hashes consistently", () => {
    const hash = computeContentHash("hello");
    expect(hash).toHaveLength(64);
    expect(computeContentHash("hello")).toBe(hash);
  });
});
