import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unauthorized, badRequest, notFound, jsonData, tooManyRequests } from "@/lib/api-response";
import { clientRateLimitKey, rateLimit } from "@/lib/rate-limit";

async function sessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const target = await prisma.user.findUnique({
    where: { username: username.replace(/^@/, "") },
    select: { id: true },
  });
  if (!target) return notFound("User not found");

  const [followerCount, user] = await Promise.all([
    prisma.userFollow.count({ where: { followingId: target.id } }),
    sessionUser(),
  ]);

  let following = false;
  if (user) {
    const row = await prisma.userFollow.findUnique({
      where: { followerId_followingId: { followerId: user.id, followingId: target.id } },
    });
    following = !!row;
  }

  return jsonData({ following, followerCount });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const user = await sessionUser();
  if (!user) return unauthorized();

  const limit = rateLimit({
    key: clientRateLimitKey(req, `follow:${user.id}`),
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.ok) return tooManyRequests();

  const { username } = await params;
  const target = await prisma.user.findUnique({
    where: { username: username.replace(/^@/, "") },
    select: { id: true, username: true },
  });
  if (!target) return notFound("User not found");
  if (target.id === user.id) return badRequest("Cannot follow yourself");

  const existing = await prisma.userFollow.findUnique({
    where: { followerId_followingId: { followerId: user.id, followingId: target.id } },
  });

  if (existing) {
    await prisma.userFollow.delete({ where: { id: existing.id } });
  } else {
    await prisma.userFollow.create({
      data: { followerId: user.id, followingId: target.id },
    });
  }

  const followerCount = await prisma.userFollow.count({ where: { followingId: target.id } });
  return jsonData({ following: !existing, followerCount });
}
