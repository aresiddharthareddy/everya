import { prisma } from "@/lib/prisma";

export type TraceExportFile = { path: string; content: string };

export type TraceExportBundle = {
  name: string;
  slug: string;
  description: string | null;
  ownerUsername: string;
  exportedAt: string;
  metadata: { documentCount: number; folderCount: number };
  files: TraceExportFile[];
};

export async function buildTraceExport(repositoryId: string): Promise<TraceExportBundle | null> {
  const repo = await prisma.repository.findUnique({
    where: { id: repositoryId },
    include: { owner: { select: { username: true } } },
  });
  if (!repo) return null;

  const [folders, documents] = await Promise.all([
    prisma.folder.findMany({ where: { repositoryId }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.document.findMany({
      where: { repositoryId },
      orderBy: { title: "asc" },
      select: { title: true, slug: true, content: true, folderId: true },
    }),
  ]);

  const folderPath = (folderId: string | null): string => {
    if (!folderId) return "";
    const parts: string[] = [];
    let current = folders.find((f) => f.id === folderId);
    while (current) {
      parts.unshift(current.slug);
      current = current.parentId ? folders.find((f) => f.id === current!.parentId) : undefined;
    }
    return parts.join("/");
  };

  const files: TraceExportFile[] = documents.map((doc) => {
    const dir = folderPath(doc.folderId);
    const path = dir ? `${dir}/${doc.slug}.md` : `${doc.slug}.md`;
    const header = doc.title !== doc.slug ? `# ${doc.title}\n\n` : "";
    return { path, content: `${header}${doc.content}` };
  });

  return {
    name: repo.name,
    slug: repo.slug,
    description: repo.description,
    ownerUsername: repo.owner.username,
    exportedAt: new Date().toISOString(),
    metadata: { documentCount: documents.length, folderCount: folders.length },
    files,
  };
}
