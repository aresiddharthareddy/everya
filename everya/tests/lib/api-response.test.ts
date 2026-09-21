import { describe, it, expect } from "vitest";
import { unauthorized, badRequest, jsonData } from "@/lib/api-response";

describe("api-response helpers", () => {
  it("unauthorized returns 401", async () => {
    const res = unauthorized();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("badRequest returns 400 with details", async () => {
    const res = badRequest("Invalid", { field: "name" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid");
    expect(body.details).toEqual({ field: "name" });
  });

  it("jsonData returns payload", async () => {
    const res = jsonData({ ok: true });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });
});
