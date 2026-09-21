import { describe, it, expect } from "vitest";
import {
  personHref,
  publicationHref,
  tracePageHref,
  repositoryHref,
  documentSharePath,
} from "@/lib/share-url";

describe("share-url helpers", () => {
  const repo = { slug: "docs", owner: { username: "infraops" } };

  it("builds person and publication paths", () => {
    expect(personHref("@alice")).toBe("/u/alice");
    expect(publicationHref("everya")).toBe("/p/everya");
  });

  it("builds trace page path", () => {
    expect(tracePageHref("infraops", "platform-docs")).toBe("/u/infraops/trace/platform-docs");
  });

  it("routes repositories to publication or trace", () => {
    expect(repositoryHref({ ...repo, publication: { handle: "everya" } })).toBe("/p/everya");
    expect(repositoryHref({ ...repo, publication: null })).toBe("/u/infraops/trace/docs");
  });

  it("builds document share paths with optional hash", () => {
    expect(
      documentSharePath({ slug: "intro", publicationId: null, repository: repo })
    ).toBe("/u/infraops/trace/docs/intro");
    expect(
      documentSharePath(
        {
          slug: "post",
          publicationId: "pub-1",
          publication: { handle: "everya" },
          repository: repo,
        },
        "discussion"
      )
    ).toBe("/p/everya/post#discussion");
  });
});
