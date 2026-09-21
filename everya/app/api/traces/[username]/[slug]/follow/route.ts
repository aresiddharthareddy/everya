import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { trackEvent } from "@/services/analytics";
import { unauthorized, notFound, jsonData, tooManyRequests } from "@/lib/api-response";
import { clientRateLimitKey, rateLimit } from "@/lib/rate-limit";

async function loadTrace(username: string, slug: string) {
  return prisma.repository.findFirst({
    where: {
      slug,
      publication: null,
      owner: { username: username.replace(/^@/, "") },
    },
    include: { owner: { select: { id: true } } },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string; slug: string }> }
) {
  const { username, slug } = await params;
  const trace = await loadTrace(username, slug);
  if (!trace || trace.visibility !== "PUBLIC") return notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  const followerCount = await prisma.traceFollow.count({ where: { repositoryId: trace.id } });
  let following = false;
  if (session) {
    following = !!(await prisma.traceFollow.findUnique({
      where: { repositoryId_userId: { repositoryId: trace.id, userId: session.user.id } },
    }));
  }
  return jsonData({ following, followerCount });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string; slug: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const limit = rateLimit({
    key: clientRateLimitKey(req, `trace-follow:${session.user.id}`),
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.ok) return tooManyRequests();

  const { username, slug } = await params;
  const trace = await loadTrace(username, slug);
  if (!trace || trace.visibility !== "PUBLIC") return notFound();

  const existing = await prisma.traceFollow.findUnique({
    where: { repositoryId_userId: { repositoryId: trace.id, userId: session.user.id } },
  });

  if (existing) {
    await prisma.traceFollow.delete({ where: { id: existing.id } });
    await trackEvent({ eventType: "trace_unfollow", userId: session.user.id, entityId: trace.id });
    const followerCount = await prisma.traceFollow.count({ where: { repositoryId: trace.id } });
    return jsonData({ following: false, followerCount });
  }

  await prisma.traceFollow.create({
    data: { repositoryId: trace.id, userId: session.user.id },
  });
  await trackEvent({ eventType: "trace_follow", userId: session.user.id, entityId: trace.id });
  if (trace.owner.id !== session.user.id) {
    await notify({
      userId: trace.owner.id,
      actorId: session.user.id,
      type: "FOLLOW",
      title: "New trace follower",
      message: `Someone followed ${trace.name}`,
      link: `/u/${username}/trace/${slug}`,
    });
  }

  const followerCount = await prisma.traceFollow.count({ where: { repositoryId: trace.id } });
  return jsonData({ following: true, followerCount });
}
