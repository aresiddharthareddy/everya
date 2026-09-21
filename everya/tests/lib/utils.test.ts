import { describe, it, expect } from "vitest";
import { slugify, calcReadingMinutes, formatCount, formatUsername } from "@/lib/utils";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("returns untitled for empty input", () => {
    expect(slugify("   ")).toBe("untitled");
  });
});

describe("calcReadingMinutes", () => {
  it("returns at least 1 minute", () => {
    expect(calcReadingMinutes("")).toBe(1);
  });

  it("estimates from word count", () => {
    const words = Array(400).fill("word").join(" ");
    expect(calcReadingMinutes(words)).toBe(2);
  });
});

describe("formatCount", () => {
  it("formats thousands", () => {
    expect(formatCount(1500)).toBe("1.5K");
  });
});

describe("formatUsername", () => {
  it("prefixes @ when missing", () => {
    expect(formatUsername("alex")).toBe("@alex");
  });
});
