import { describe, it, expect } from "vitest";
import { canPerformRepositoryAction } from "@/lib/permissions";

const repo = { visibility: "PRIVATE", ownerId: "owner-1" };

describe("canPerformRepositoryAction", () => {
  it("maps view to canViewRepo", () => {
    expect(canPerformRepositoryAction("view", { visibility: "PUBLIC", ownerId: "x" })).toBe(true);
    expect(canPerformRepositoryAction("view", repo, undefined)).toBe(false);
  });

  it("allows owner to edit and manage", () => {
    expect(canPerformRepositoryAction("edit", repo, "owner-1")).toBe(true);
    expect(canPerformRepositoryAction("manage", repo, "owner-1")).toBe(true);
    expect(canPerformRepositoryAction("delete", repo, "owner-1")).toBe(true);
  });

  it("denies non-owner mutations", () => {
    expect(canPerformRepositoryAction("edit", repo, "other")).toBe(false);
  });
});
