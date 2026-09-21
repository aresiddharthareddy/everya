import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import type { PublicationRole } from "@prisma/client";
import { canManageMembers, canRemoveMember, canChangeMemberRole } from "@/lib/permissions/publication";

export async function getPublicationByHandle(handle: string) {
  return prisma.publication.findUnique({
    where: { handle },
    include: {
      owner: { select: { id: true, username: true, name: true, image: true } },
      _count: { select: { followers: true, members: true, articles: true } },
    },
  });
}

export async function getMemberRole(publicationId: string, userId: string): Promise<PublicationRole | null> {
  const m = await prisma.publicationMember.findUnique({
    where: { publicationId_userId: { publicationId, userId } },
  });
  return m?.role ?? null;
}

export async function createPublication(
  userId: string,
  data: { name: string; handle: string; description?: string; visibility?: "PUBLIC" | "PRIVATE" }
) {
  const handle = slugify(data.handle);
  const repoSlug = handle;

  return prisma.$transaction(async (tx) => {
    const repo = await tx.repository.create({
      data: {
        name: data.name,
        slug: repoSlug,
        description: data.description,
        visibility: data.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
        ownerId: userId,
      },
    });

    const publication = await tx.publication.create({
      data: {
        name: data.name,
        handle,
        description: data.description,
        visibility: data.visibility ?? "PUBLIC",
        ownerId: userId,
        repositoryId: repo.id,
      },
      include: { owner: { select: { username: true } } },
    });

    await tx.publicationMember.create({
      data: { publicationId: publication.id, userId, role: "OWNER" },
    });

    return publication;
  });
}

export async function addPublicationMember(
  publicationId: string,
  actorId: string,
  targetUserId: string,
  role: PublicationRole
) {
  const actorRole = await getMemberRole(publicationId, actorId);
  if (!actorRole || !canManageMembers(actorRole)) return { error: "forbidden" as const };

  const existing = await prisma.publicationMember.findUnique({
    where: { publicationId_userId: { publicationId, userId: targetUserId } },
  });
  if (existing) return { error: "exists" as const };

  await prisma.publicationMember.create({
    data: { publicationId, userId: targetUserId, role },
  });
  return { ok: true as const };
}

export async function updateMemberRole(
  publicationId: string,
  actorId: string,
  targetUserId: string,
  role: PublicationRole
) {
  const actorRole = await getMemberRole(publicationId, actorId);
  const target = await prisma.publicationMember.findUnique({
    where: { publicationId_userId: { publicationId, userId: targetUserId } },
  });
  if (!actorRole || !target || !canChangeMemberRole(actorRole, target.role, role)) {
    return { error: "forbidden" as const };
  }
  await prisma.publicationMember.update({
    where: { publicationId_userId: { publicationId, userId: targetUserId } },
    data: { role },
  });
  return { ok: true as const };
}

export async function removePublicationMember(
  publicationId: string,
  actorId: string,
  targetUserId: string
) {
  const actorRole = await getMemberRole(publicationId, actorId);
  const target = await prisma.publicationMember.findUnique({
    where: { publicationId_userId: { publicationId, userId: targetUserId } },
  });
  if (!actorRole || !target || !canRemoveMember(actorRole, target.role)) {
    return { error: "forbidden" as const };
  }
  await prisma.publicationMember.delete({
    where: { publicationId_userId: { publicationId, userId: targetUserId } },
  });
  return { ok: true as const };
}
