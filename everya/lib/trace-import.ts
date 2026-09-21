import { prisma } from "@/lib/prisma";
import { calcReadingMinutes, slugify } from "@/lib/utils";

export type ImportFile = { path: string; content: string };

const MARKDOWN_EXT = /\.(md|mdc|markdown)$/i;
const MAX_FILES = 500;
const MAX_FILE_BYTES = 512_000;
const MAX_TOTAL_BYTES = 10_000_000;

export type ImportPreviewNode = {
  name: string;
  type: "folder" | "document";
  children?: ImportPreviewNode[];
};

export function validateImportFiles(files: ImportFile[]): { ok: boolean; errors: string[]; tree: ImportPreviewNode[] } {
  const errors: string[] = [];
  if (!files.length) errors.push("No files provided.");
  if (files.length > MAX_FILES) errors.push(`Too many files (max ${MAX_FILES}).`);

  let totalBytes = 0;
  const normalized: ImportFile[] = [];

  for (const f of files) {
    const path = f.path.replace(/\\/g, "/").replace(/^\/+/, "");
    if (!path || path.includes("..") || path.startsWith(".")) {
      errors.push(`Invalid path: ${f.path}`);
      continue;
    }
    if (!MARKDOWN_EXT.test(path)) continue;
    const bytes = new TextEncoder().encode(f.content).length;
    if (bytes > MAX_FILE_BYTES) errors.push(`File too large: ${path}`);
    totalBytes += bytes;
    normalized.push({ path, content: f.content });
  }

  if (!normalized.length && !errors.length) errors.push("No Markdown files found (.md, .mdc).");
  if (totalBytes > MAX_TOTAL_BYTES) errors.push("Total import size exceeds limit.");

  const root: ImportPreviewNode[] = [];
  const folderMap = new Map<string, ImportPreviewNode>();

  const ensureFolder = (parts: string[]) => {
    let path = "";
    let siblings = root;
    for (const part of parts) {
      path = path ? `${path}/${part}` : part;
      let node = folderMap.get(path);
      if (!node) {
        node = { name: part, type: "folder", children: [] };
        folderMap.set(path, node);
        siblings.push(node);
      }
      siblings = node.children!;
    }
    return siblings;
  };

  for (const f of normalized) {
    const parts = f.path.split("/");
    const fileName = parts.pop()!;
    const siblings = parts.length ? ensureFolder(parts) : root;
    const title = titleFromFileName(fileName, parts[parts.length - 1]);
    siblings.push({ name: title, type: "document" });
  }

  return { ok: errors.length === 0, errors, tree: root };
}

function titleFromFileName(fileName: string, parentName?: string) {
  const base = fileName.replace(MARKDOWN_EXT, "");
  if (base.toLowerCase() === "readme") return parentName ? `${titleFromSlug(parentName)} README` : "README";
  if (base.toLowerCase() === "skill") return parentName ? titleFromSlug(parentName) : "Skill";
  return titleFromSlug(base);
}

function titleFromSlug(s: string) {
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function excerptFrom(content: string) {
  const body = content.replace(/^---[\s\S]*?---\n?/, "").trim();
  const line = body.split("\n").find((l) => l.trim() && !l.startsWith("#"));
  return (line || body).slice(0, 200).replace(/[#*`\n]/g, " ").trim();
}

export async function importTraceFromFiles(params: {
  ownerId: string;
  name: string;
  description?: string;
  files: ImportFile[];
}) {
  const { ok, errors } = validateImportFiles(params.files);
  if (!ok) throw new Error(errors.join(" "));

  const slug = slugify(params.name);
  const existing = await prisma.repository.findUnique({
    where: { ownerId_slug: { ownerId: params.ownerId, slug } },
  });
  if (existing) throw new Error("A trace with this name already exists.");

  const markdownFiles = params.files
    .map((f) => ({ path: f.path.replace(/\\/g, "/").replace(/^\/+/, ""), content: f.content }))
    .filter((f) => MARKDOWN_EXT.test(f.path) && !f.path.includes(".."));

  const repo = await prisma.repository.create({
    data: {
      name: params.name.trim(),
      slug,
      description: params.description?.trim() || null,
      visibility: "PUBLIC",
      ownerId: params.ownerId,
    },
  });

  const folderIds = new Map<string, string>();
  const usedSlugs = new Set<string>();

  const ensureFolder = async (relPath: string, parentId: string | null, sortOrder: number) => {
    const cached = folderIds.get(relPath);
    if (cached) return cached;
    const name = relPath.split("/").pop()!;
    const folder = await prisma.folder.create({
      data: { name, slug: slugify(name), repositoryId: repo.id, parentId, sortOrder },
    });
    folderIds.set(relPath, folder.id);
    return folder.id;
  };

  const uniqueSlug = (base: string) => {
    let s = slugify(base) || "doc";
    let i = 2;
    while (usedSlugs.has(s)) s = `${slugify(base)}-${i++}`;
    usedSlugs.add(s);
    return s;
  };

  const byDir = new Map<string, ImportFile[]>();
  for (const f of markdownFiles) {
    const parts = f.path.split("/");
    parts.pop();
    const dir = parts.join("/");
    if (!byDir.has(dir)) byDir.set(dir, []);
    byDir.get(dir)!.push(f);
  }

  for (const [dir, dirFiles] of byDir) {
    let parentId: string | null = null;
    if (dir) {
      const segments = dir.split("/");
      let built = "";
      for (let i = 0; i < segments.length; i++) {
        built = built ? `${built}/${segments[i]}` : segments[i];
        parentId = await ensureFolder(built, parentId, i);
      }
    }
    let sortOrder = 0;
    for (const f of dirFiles.sort((a, b) => a.path.localeCompare(b.path))) {
      const fileName = f.path.split("/").pop()!;
      const parentName = dir ? dir.split("/").pop() : undefined;
      const title = titleFromFileName(fileName, parentName);
      const slugBase = fileName.replace(MARKDOWN_EXT, "");
      await prisma.document.create({
        data: {
          title,
          slug: uniqueSlug(slugBase),
          content: f.content,
          excerpt: excerptFrom(f.content),
          readingMinutes: calcReadingMinutes(f.content),
          repositoryId: repo.id,
          folderId: parentId,
          authorId: params.ownerId,
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      });
      sortOrder++;
    }
  }

  const documentCount = await prisma.document.count({ where: { repositoryId: repo.id } });
  const owner = await prisma.user.findUnique({ where: { id: params.ownerId }, select: { username: true } });
  return { repositoryId: repo.id, slug: repo.slug, documentCount, username: owner!.username };
}
