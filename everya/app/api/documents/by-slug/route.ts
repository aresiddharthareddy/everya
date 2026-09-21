import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditTraceContent, getTraceRole } from "@/lib/permissions/trace";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const username = req.nextUrl.searchParams.get("username")?.replace(/^@/, "");
  const repo = req.nextUrl.searchParams.get("repo");
  const doc = req.nextUrl.searchParams.get("doc");

  const document = await prisma.document.findFirst({
    where: {
      slug: doc || "",
      publicationId: null,
      repository: { slug: repo || "", owner: { username: username || "" }, publication: null },
    },
    select: { id: true, title: true, content: true, subtitle: true, slug: true, status: true, repositoryId: true },
  });

  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = await getTraceRole(document.repositoryId, session.user.id);
  if (!role || !canEditTraceContent(role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ document });
}
