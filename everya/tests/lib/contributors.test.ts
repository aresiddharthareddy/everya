import { describe, it, expect } from "vitest";
import { buildDocumentContributors } from "@/lib/contributors";

const user = (id: string, username: string) => ({
  id,
  username,
  name: null,
  image: null,
});

describe("buildDocumentContributors", () => {
  it("marks author and merges revision editors", () => {
    const author = user("u1", "alice");
    const editor = user("u2", "bob");
    const result = buildDocumentContributors(author, [editor]);
    expect(result).toHaveLength(2);
    expect(result[0].roles).toContain("author");
    expect(result.find((c) => c.user.username === "bob")?.roles).toEqual(["editor"]);
  });

  it("does not duplicate author when they also edited", () => {
    const author = user("u1", "alice");
    const result = buildDocumentContributors(author, [author]);
    expect(result).toHaveLength(1);
    expect(result[0].roles).toEqual(["author", "editor"]);
  });

  it("includes last editor when missing from revisions", () => {
    const author = user("u1", "alice");
    const last = user("u3", "carol");
    const result = buildDocumentContributors(author, [], last);
    expect(result.map((c) => c.user.username)).toContain("carol");
  });
});
