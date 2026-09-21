import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { createRepositorySchema } from "@/lib/validators";
import { unauthorized, badRequest, conflict, jsonData, tooManyRequests } from "@/lib/api-response";
import { clientRateLimitKey, rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const limit = rateLimit({
    key: clientRateLimitKey(req, `repo-create:${session.user.id}`),
    limit: 20,
    windowMs: 60_000,
  });
  if (!limit.ok) return tooManyRequests();

  const parsed = createRepositorySchema.safeParse(await req.json());
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message || "Invalid input", parsed.error.flatten());
  }

  const { name, description, visibility } = parsed.data;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return badRequest("User not found");

  const slug = slugify(name);
  const existing = await prisma.repository.findUnique({
    where: { ownerId_slug: { ownerId: user.id, slug } },
  });
  if (existing) return conflict("Repository slug already exists");

  const repo = await prisma.repository.create({
    data: {
      name,
      slug,
      description: description?.trim() || null,
      visibility: visibility || "PUBLIC",
      ownerId: user.id,
    },
  });

  return jsonData({ ...repo, ownerUsername: user.username });
}
