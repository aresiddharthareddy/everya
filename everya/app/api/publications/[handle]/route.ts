import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updatePublicationSchema } from "@/lib/validators";
import { getMemberRole } from "@/services/publications";
import { canEditPublicationSettings } from "@/lib/permissions/publication";
import { unauthorized, badRequest, notFound, forbidden, jsonData } from "@/lib/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const publication = await prisma.publication.findUnique({
    where: { handle },
    include: {
      owner: { select: { id: true, username: true, name: true, image: true, bio: true } },
      members: {
        include: { user: { select: { id: true, username: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { followers: true, articles: true } },
    },
  });
  if (!publication) return notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  const role = session ? await getMemberRole(publication.id, session.user.id) : null;
  if (publication.visibility === "PRIVATE" && !role) return notFound();

  const articles = await prisma.document.findMany({
    where: {
      publicationId: publication.id,
      ...(role ? {} : { status: "PUBLISHED" as const }),
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: 20,
    include: { author: { select: { username: true, name: true, image: true } } },
  });

  let following = false;
  if (session) {
    const f = await prisma.publicationFollow.findUnique({
      where: { publicationId_userId: { publicationId: publication.id, userId: session.user.id } },
    });
    following = !!f;
  }

  return jsonData({ publication, articles, memberRole: role, following });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const { handle } = await params;
  const publication = await prisma.publication.findUnique({ where: { handle } });
  if (!publication) return notFound();

  const role = await getMemberRole(publication.id, session.user.id);
  if (!role || !canEditPublicationSettings(role)) return forbidden();

  const parsed = updatePublicationSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid input", parsed.error.flatten());

  const updated = await prisma.publication.update({
    where: { id: publication.id },
    data: parsed.data,
  });
  return jsonData(updated);
}
