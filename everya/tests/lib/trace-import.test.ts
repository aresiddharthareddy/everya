import { describe, it, expect } from "vitest";
import { validateImportFiles } from "@/lib/trace-import";

describe("trace import validation", () => {
  it("accepts valid markdown tree", () => {
    const result = validateImportFiles([
      { path: "intro/README.md", content: "# Intro\n\nHello world." },
      { path: "intro/setup.md", content: "# Setup\n\nSteps here." },
    ]);
    expect(result.ok).toBe(true);
    expect(result.tree.length).toBeGreaterThan(0);
  });

  it("rejects path traversal", () => {
    const result = validateImportFiles([{ path: "../secret.md", content: "# Nope" }]);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("Invalid path"))).toBe(true);
  });

  it("rejects empty file list", () => {
    const result = validateImportFiles([]);
    expect(result.ok).toBe(false);
  });

  it("ignores non-markdown files", () => {
    const result = validateImportFiles([
      { path: "image.png", content: "binary" },
      { path: "notes.txt", content: "text" },
    ]);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("No Markdown"))).toBe(true);
  });
});
