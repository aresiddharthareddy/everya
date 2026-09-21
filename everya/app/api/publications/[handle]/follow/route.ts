import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { trackEvent } from "@/services/analytics";
import { unauthorized, notFound, jsonData, tooManyRequests } from "@/lib/api-response";
import { clientRateLimitKey, rateLimit } from "@/lib/rate-limit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const pub = await prisma.publication.findUnique({ where: { handle }, select: { id: true, visibility: true } });
  if (!pub || pub.visibility === "PRIVATE") return notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  const followerCount = await prisma.publicationFollow.count({ where: { publicationId: pub.id } });
  let following = false;
  if (session) {
    const row = await prisma.publicationFollow.findUnique({
      where: { publicationId_userId: { publicationId: pub.id, userId: session.user.id } },
    });
    following = !!row;
  }
  return jsonData({ following, followerCount });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const limit = rateLimit({
    key: clientRateLimitKey(req, `pub-follow:${session.user.id}`),
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.ok) return tooManyRequests();

  const { handle } = await params;
  const pub = await prisma.publication.findUnique({
    where: { handle },
    include: { owner: { select: { id: true } } },
  });
  if (!pub || pub.visibility === "PRIVATE") return notFound();

  const existing = await prisma.publicationFollow.findUnique({
    where: { publicationId_userId: { publicationId: pub.id, userId: session.user.id } },
  });

  if (existing) {
    await prisma.publicationFollow.delete({ where: { id: existing.id } });
    await trackEvent({ eventType: "publication_unfollow", userId: session.user.id, entityId: pub.id });
    const followerCount = await prisma.publicationFollow.count({ where: { publicationId: pub.id } });
    return jsonData({ following: false, followerCount });
  }

  await prisma.publicationFollow.create({
    data: { publicationId: pub.id, userId: session.user.id },
  });
  await trackEvent({ eventType: "publication_follow", userId: session.user.id, entityId: pub.id });
  if (pub.owner.id !== session.user.id) {
    await notify({
      userId: pub.owner.id,
      actorId: session.user.id,
      type: "FOLLOW",
      title: "New publication follower",
      message: `Someone followed ${pub.name}`,
      link: `/p/${handle}`,
    });
  }

  const followerCount = await prisma.publicationFollow.count({ where: { publicationId: pub.id } });
  return jsonData({ following: true, followerCount });
}
