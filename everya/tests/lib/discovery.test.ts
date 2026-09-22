import { describe, it, expect } from "vitest";
import { buildReadingPaths } from "@/services/knowledge";

describe("buildReadingPaths", () => {
  it("builds chains from explicit NEXT links", () => {
    const paths = buildReadingPaths(
      [
        { type: "NEXT", fromId: "a", toId: "b", fromTitle: "A", toTitle: "B" },
        { type: "NEXT", fromId: "b", toId: "c", fromTitle: "B", toTitle: "C" },
      ],
      (id) => `/doc/${id}`
    );
    expect(paths).toHaveLength(1);
    expect(paths[0].documents.map((d) => d.id)).toEqual(["a", "b", "c"]);
  });

  it("ignores single-document chains", () => {
    const paths = buildReadingPaths(
      [{ type: "RELATED", fromId: "a", toId: "b", fromTitle: "A", toTitle: "B" }],
      (id) => `/doc/${id}`
    );
    expect(paths).toHaveLength(0);
  });

  it("splits multiple reading paths", () => {
    const paths = buildReadingPaths(
      [
        { type: "NEXT", fromId: "a", toId: "b", fromTitle: "A", toTitle: "B" },
        { type: "NEXT", fromId: "x", toId: "y", fromTitle: "X", toTitle: "Y" },
      ],
      (id) => `/doc/${id}`
    );
    expect(paths).toHaveLength(2);
  });
});

describe("discovery security rules", () => {
  it("requires explicit link types for reading paths", () => {
    const paths = buildReadingPaths(
      [{ type: "DEPENDS_ON", fromId: "a", toId: "b", fromTitle: "A", toTitle: "B" }],
      (id) => `/doc/${id}`
    );
    expect(paths).toHaveLength(0);
  });
});
