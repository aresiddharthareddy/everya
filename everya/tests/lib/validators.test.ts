import { describe, it, expect } from "vitest";
import {
  createRepositorySchema,
  createDocumentSchema,
  createCommentSchema,
  updateProfileSchema,
} from "@/lib/validators";

describe("createRepositorySchema", () => {
  it("accepts valid input", () => {
    const r = createRepositorySchema.safeParse({ name: "Platform Docs", visibility: "PUBLIC" });
    expect(r.success).toBe(true);
  });

  it("rejects empty name", () => {
    const r = createRepositorySchema.safeParse({ name: "  " });
    expect(r.success).toBe(false);
  });
});

describe("createDocumentSchema", () => {
  it("requires title and repoSlug", () => {
    expect(createDocumentSchema.safeParse({ title: "Hi", repoSlug: "docs" }).success).toBe(true);
    expect(createDocumentSchema.safeParse({ title: "", repoSlug: "docs" }).success).toBe(false);
  });
});

describe("createCommentSchema", () => {
  it("rejects empty content", () => {
    expect(createCommentSchema.safeParse({ documentId: "1", content: " " }).success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("accepts partial profile updates", () => {
    expect(updateProfileSchema.safeParse({ bio: "Engineer" }).success).toBe(true);
  });
});
