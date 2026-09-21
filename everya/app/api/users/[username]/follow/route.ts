import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

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

  return NextResponse.json({ following, followerCount });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await params;
  const target = await prisma.user.findUnique({
    where: { username: username.replace(/^@/, "") },
    select: { id: true, username: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === user.id) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

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
  return NextResponse.json({ following: !existing, followerCount });
}
