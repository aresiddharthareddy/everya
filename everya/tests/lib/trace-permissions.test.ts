import { describe, it, expect } from "vitest";
import {
  canEditTraceContent,
  canManageTraceMembers,
  canManageTraceSettings,
  traceRoleAtLeast,
} from "@/lib/permissions/trace";

describe("trace permissions", () => {
  it("OWNER has full access", () => {
    expect(canEditTraceContent("OWNER")).toBe(true);
    expect(canManageTraceSettings("OWNER")).toBe(true);
    expect(canManageTraceMembers("OWNER")).toBe(true);
  });

  it("EDITOR can edit settings but not members", () => {
    expect(canEditTraceContent("EDITOR")).toBe(true);
    expect(canManageTraceSettings("EDITOR")).toBe(true);
    expect(canManageTraceMembers("EDITOR")).toBe(false);
  });

  it("CONTRIBUTOR can edit content only", () => {
    expect(canEditTraceContent("CONTRIBUTOR")).toBe(true);
    expect(canManageTraceSettings("CONTRIBUTOR")).toBe(false);
    expect(canManageTraceMembers("CONTRIBUTOR")).toBe(false);
  });

  it("ranks roles correctly", () => {
    expect(traceRoleAtLeast("OWNER", "EDITOR")).toBe(true);
    expect(traceRoleAtLeast("CONTRIBUTOR", "EDITOR")).toBe(false);
  });
});
