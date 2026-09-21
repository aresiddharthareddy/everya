import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify, calcReadingMinutes } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, content, repoSlug } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const repo = await prisma.repository.findFirst({
    where: { slug: repoSlug, ownerId: session.user.id },
  });
  if (!repo) return NextResponse.json({ error: "Repository not found" }, { status: 404 });

  const base = slugify(title);
  let slug = base;
  for (let n = 2; ; n++) {
    const clash = await prisma.document.findUnique({
      where: { repositoryId_slug: { repositoryId: repo.id, slug } },
    });
    if (!clash) break;
    slug = `${base}-${n}`;
  }

  const excerpt = (content || "").slice(0, 200).replace(/[#*`\n]/g, " ").trim();
  const doc = await prisma.document.create({
    data: {
      title: title.trim(),
      slug,
      content: content || "",
      excerpt,
      readingMinutes: calcReadingMinutes(content || ""),
      repositoryId: repo.id,
      authorId: session.user.id,
    },
  });

  return NextResponse.json(doc);
}
