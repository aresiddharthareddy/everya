import { NextRequest } from "next/server";
import { searchAll } from "@/services/search";
import { jsonData, tooManyRequests } from "@/lib/api-response";
import { clientRateLimitKey, rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const limit = rateLimit({
    key: clientRateLimitKey(req, "search"),
    limit: 60,
    windowMs: 60_000,
  });
  if (!limit.ok) return tooManyRequests();

  const q = req.nextUrl.searchParams.get("q") || "";
  const type = req.nextUrl.searchParams.get("type") as "all" | "articles" | "authors" | "publications" | null;
  const results = await searchAll(q, { type: type ?? "all" });
  return jsonData({ results });
}
