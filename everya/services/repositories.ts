import { prisma } from "@/lib/prisma";
import { canViewRepo } from "@/lib/access";
import type { TreeNode } from "@/types";

export async function getRepositoryTree(
  repositoryId: string
): Promise<TreeNode[]> {
  const [folders, documents] = await Promise.all([
    prisma.folder.findMany({
      where: { repositoryId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.document.findMany({
      where: { repositoryId },
      orderBy: { title: "asc" },
      select: { id: true, title: true, slug: true, folderId: true },
    }),
  ]);

  const buildFolderNodes = (parentId: string | null): TreeNode[] => {
    const childFolders = folders
      .filter((f) => f.parentId === parentId)
      .map((f) => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        type: "folder" as const,
        children: [
          ...buildFolderNodes(f.id),
          ...documents
            .filter((d) => d.folderId === f.id)
            .map((d) => ({
              id: d.id,
              name: d.title,
              slug: d.slug,
              type: "document" as const,
            })),
        ],
      }));

    if (parentId !== null) return childFolders;

    const rootDocs = documents
      .filter((d) => !d.folderId)
      .map((d) => ({
        id: d.id,
        name: d.title,
        slug: d.slug,
        type: "document" as const,
      }));

    return [...childFolders, ...rootDocs];
  };

  return buildFolderNodes(null);
}

export async function getRepositoryByPath(
  ownerUsername: string,
  repoSlug: string
) {
  return prisma.repository.findFirst({
    where: {
      slug: repoSlug,
      owner: { username: ownerUsername.replace(/^@/, "") },
    },
    include: {
      owner: { select: { id: true, username: true, image: true, name: true } },
      _count: { select: { documents: true } },
    },
  });
}

export function assertCanView(
  repo: { visibility: string; ownerId: string } | null,
  userId?: string
) {
  if (!repo) return false;
  return canViewRepo(repo, userId);
}
