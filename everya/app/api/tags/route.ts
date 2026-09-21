import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { documents: true } } },
  });
  return NextResponse.json({
    tags: tags.map((t) => ({ name: t.name, slug: t.slug, count: t._count.documents })),
  });
}
