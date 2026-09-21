import { describe, it, expect } from "vitest";
import { canViewRepo } from "@/lib/access";

describe("canViewRepo", () => {
  const ownerId = "user-1";

  it("allows anyone to view PUBLIC repos", () => {
    expect(canViewRepo({ visibility: "PUBLIC", ownerId }, undefined)).toBe(true);
    expect(canViewRepo({ visibility: "PUBLIC", ownerId }, "other")).toBe(true);
  });

  it("denies PRIVATE repos to anonymous users", () => {
    expect(canViewRepo({ visibility: "PRIVATE", ownerId }, undefined)).toBe(false);
  });

  it("allows owner to view PRIVATE repos", () => {
    expect(canViewRepo({ visibility: "PRIVATE", ownerId }, ownerId)).toBe(true);
  });

  it("denies non-owner PRIVATE access", () => {
    expect(canViewRepo({ visibility: "PRIVATE", ownerId }, "other")).toBe(false);
  });
});
