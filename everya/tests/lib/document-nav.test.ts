import { describe, it, expect } from "vitest";
import { flattenDocTree, resolveDocNav, treeSiblingNav } from "@/lib/document-nav";

const tree = [
  { id: "1", name: "A", slug: "a", type: "document" as const },
  { id: "2", name: "B", slug: "b", type: "document" as const },
];

describe("document-nav", () => {
  it("flattens tree docs", () => {
    expect(flattenDocTree(tree, "/u/alex/trace/docs")).toEqual([
      { title: "A", href: "/u/alex/trace/docs/a" },
      { title: "B", href: "/u/alex/trace/docs/b" },
    ]);
  });

  it("resolves siblings", () => {
    const nav = treeSiblingNav(tree, "/base", "b");
    expect(nav.previous?.title).toBe("A");
    expect(nav.next).toBeNull();
  });

  it("prefers explicit PREVIOUS/NEXT links", () => {
    const nav = resolveDocNav(
      [{ type: "PREVIOUS", href: "/x/a", document: { title: "Custom Prev" } }],
      tree,
      "/base",
      "b"
    );
    expect(nav.previous?.title).toBe("Custom Prev");
  });
});
