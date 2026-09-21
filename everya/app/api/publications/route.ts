import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPublicationSchema } from "@/lib/validators";
import { createPublication } from "@/services/publications";
import { trackEvent } from "@/services/analytics";
import { unauthorized, badRequest, conflict, jsonData, tooManyRequests } from "@/lib/api-response";
import { clientRateLimitKey, rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const pubs = await prisma.publication.findMany({
    where: { visibility: "PUBLIC" },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      owner: { select: { username: true, name: true, image: true } },
      _count: { select: { followers: true, articles: true } },
    },
  });
  return jsonData(pubs);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const limit = rateLimit({
    key: clientRateLimitKey(req, `pub-create:${session.user.id}`),
    limit: 10,
    windowMs: 60_000,
  });
  if (!limit.ok) return tooManyRequests();

  const parsed = createPublicationSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid input", parsed.error.flatten());

  const existing = await prisma.publication.findUnique({ where: { handle: parsed.data.handle } });
  if (existing) return conflict("Handle already taken");

  const publication = await createPublication(session.user.id, parsed.data);
  await trackEvent({
    eventType: "publication_created",
    userId: session.user.id,
    entityType: "publication",
    entityId: publication.id,
  });

  return jsonData(publication, 201);
}
