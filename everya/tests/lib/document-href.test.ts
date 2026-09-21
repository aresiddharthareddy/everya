import { describe, it, expect } from "vitest";
import { documentReaderHref } from "@/lib/document-href";

describe("documentReaderHref", () => {
  const repo = { slug: "docs", owner: { username: "infraops" } };

  it("returns trace URL for standalone documents", () => {
    expect(
      documentReaderHref({ slug: "intro", publicationId: null, repository: repo })
    ).toBe("/u/infraops/trace/docs/intro");
  });

  it("returns publication URL for publication articles", () => {
    expect(
      documentReaderHref({
        slug: "hello",
        publicationId: "pub-1",
        publication: { handle: "everya" },
        repository: repo,
      })
    ).toBe("/p/everya/hello");
  });
});
