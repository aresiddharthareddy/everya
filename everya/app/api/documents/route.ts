import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify, calcReadingMinutes } from "@/lib/utils";
import { createDocumentSchema } from "@/lib/validators";
import { unauthorized, badRequest, notFound, jsonData, tooManyRequests } from "@/lib/api-response";
import { clientRateLimitKey, rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const limit = rateLimit({
    key: clientRateLimitKey(req, `doc-create:${session.user.id}`),
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.ok) return tooManyRequests();

  const parsed = createDocumentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message || "Invalid input", parsed.error.flatten());
  }

  const { title, content, repoSlug } = parsed.data;
  const repo = await prisma.repository.findFirst({
    where: { slug: repoSlug, ownerId: session.user.id },
  });
  if (!repo) return notFound("Repository not found");

  const base = slugify(title);
  let slug = base;
  for (let n = 2; ; n++) {
    const clash = await prisma.document.findUnique({
      where: { repositoryId_slug: { repositoryId: repo.id, slug } },
    });
    if (!clash) break;
    slug = `${base}-${n}`;
  }

  const body = content || "";
  const excerpt = body.slice(0, 200).replace(/[#*`\n]/g, " ").trim();
  const doc = await prisma.document.create({
    data: {
      title,
      slug,
      content: body,
      excerpt,
      readingMinutes: calcReadingMinutes(body),
      repositoryId: repo.id,
      authorId: session.user.id,
    },
  });

  return jsonData(doc);
}
