import { describe, it, expect } from "vitest";
import {
  revisionContentChanged,
  revisionMatchesSnapshot,
} from "@/lib/document-revision";

describe("revisionContentChanged", () => {
  const base = { title: "Hello", content: "Body", subtitle: null };

  it("detects title changes", () => {
    expect(revisionContentChanged(base, { ...base, title: "Hi" })).toBe(true);
  });

  it("detects content changes", () => {
    expect(revisionContentChanged(base, { ...base, content: "New" })).toBe(true);
  });

  it("detects subtitle changes", () => {
    expect(revisionContentChanged(base, { ...base, subtitle: "Sub" })).toBe(true);
  });

  it("ignores identical snapshots", () => {
    expect(revisionContentChanged(base, { ...base })).toBe(false);
  });
});

describe("revisionMatchesSnapshot", () => {
  it("matches equivalent fields", () => {
    expect(
      revisionMatchesSnapshot(
        { title: "A", content: "B", subtitle: undefined },
        { title: "A", content: "B", subtitle: null }
      )
    ).toBe(true);
  });

  it("rejects different content", () => {
    expect(
      revisionMatchesSnapshot(
        { title: "A", content: "B" },
        { title: "A", content: "C" }
      )
    ).toBe(false);
  });
});
