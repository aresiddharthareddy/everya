import { describe, it, expect } from "vitest";
import {
  canManageMembers,
  canPublishArticle,
  canRemoveMember,
  canChangeMemberRole,
  roleAtLeast,
} from "@/lib/permissions/publication";

describe("publication RBAC", () => {
  it("ranks roles correctly", () => {
    expect(roleAtLeast("OWNER", "ADMIN")).toBe(true);
    expect(roleAtLeast("WRITER", "EDITOR")).toBe(false);
    expect(roleAtLeast("CONTRIBUTOR", "WRITER")).toBe(false);
  });

  it("allows admins to manage members", () => {
    expect(canManageMembers("ADMIN")).toBe(true);
    expect(canManageMembers("EDITOR")).toBe(false);
  });

  it("allows writers to publish", () => {
    expect(canPublishArticle("WRITER")).toBe(true);
    expect(canPublishArticle("CONTRIBUTOR")).toBe(false);
  });

  it("prevents removing owner", () => {
    expect(canRemoveMember("OWNER", "OWNER")).toBe(false);
    expect(canRemoveMember("ADMIN", "OWNER")).toBe(false);
    expect(canRemoveMember("OWNER", "WRITER")).toBe(true);
  });

  it("prevents promoting to owner", () => {
    expect(canChangeMemberRole("OWNER", "WRITER", "OWNER")).toBe(false);
    expect(canChangeMemberRole("ADMIN", "WRITER", "ADMIN")).toBe(true);
  });
});
