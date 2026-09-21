import { describe, it, expect } from "vitest";
import { canDeleteComment, canModerateDocumentComments } from "@/lib/permissions/comment";

describe("canModerateDocumentComments", () => {
  const doc = { authorId: "author-1" };

  it("allows document author", () => {
    expect(canModerateDocumentComments("author-1", doc, {})).toBe(true);
  });

  it("allows trace editors", () => {
    expect(canModerateDocumentComments("editor-1", doc, { traceRole: "EDITOR" })).toBe(true);
  });

  it("denies unrelated users", () => {
    expect(canModerateDocumentComments("stranger", doc, { traceRole: null })).toBe(false);
  });
});

describe("canDeleteComment", () => {
  it("allows comment author", () => {
    expect(canDeleteComment("u1", { authorId: "u1" }, false)).toBe(true);
  });

  it("allows moderators on others' comments", () => {
    expect(canDeleteComment("mod", { authorId: "u1" }, true)).toBe(true);
  });

  it("denies strangers", () => {
    expect(canDeleteComment("u2", { authorId: "u1" }, false)).toBe(false);
  });
});
