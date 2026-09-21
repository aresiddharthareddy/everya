import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createArticleSchema } from "@/lib/validators";
import { createArticleDraft } from "@/services/articles";
import { unauthorized, badRequest, notFound, jsonData, tooManyRequests } from "@/lib/api-response";
import { clientRateLimitKey, rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const limit = rateLimit({
    key: clientRateLimitKey(req, `article-create:${session.user.id}`),
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.ok) return tooManyRequests();

  const parsed = createArticleSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid input", parsed.error.flatten());

  const article = await createArticleDraft(session.user.id, parsed.data);
  if (!article) return notFound("Publication not found or insufficient permissions");

  return jsonData(article, 201);
}
