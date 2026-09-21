import { describe, it, expect } from "vitest";
import { draftEditHref } from "@/lib/draft-links";

describe("draftEditHref", () => {
  const traceRepo = {
    slug: "platform-docs",
    owner: { username: "infraops" },
  };

  it("links trace drafts to the trace editor", () => {
    expect(
      draftEditHref({
        id: "doc-1",
        slug: "getting-started",
        publicationId: null,
        repository: traceRepo,
      })
    ).toBe("/u/infraops/trace/platform-docs/getting-started/edit");
  });

  it("links publication drafts to the write flow", () => {
    expect(
      draftEditHref({
        id: "doc-2",
        slug: "my-post",
        publicationId: "pub-1",
        publication: { handle: "everya" },
        repository: traceRepo,
      })
    ).toBe("/p/everya/write?id=doc-2");
  });
});
