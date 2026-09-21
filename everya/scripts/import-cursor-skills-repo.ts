import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { calcReadingMinutes, slugify } from "../lib/utils";

const REPO_DIR = path.join(__dirname, "..", "Cursor-Skills-universal");
const REPO_SLUG = "cursor-skills-universal";

function titleFromName(name: string) {
  return name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function excerptFrom(content: string) {
  const body = content.replace(/^---[\s\S]*?---\n?/, "").trim();
  const line = body.split("\n").find((l) => l.trim() && !l.startsWith("#"));
  return (line || body).slice(0, 200).trim();
}

async function main() {
  if (!fs.existsSync(REPO_DIR)) {
    throw new Error(`Clone the repo first: git clone https://github.com/aresiddharthareddy/Cursor-Skills-universal.git`);
  }

  const prisma = new PrismaClient();
  const alex = await prisma.user.findUnique({ where: { username: "alex" } });
  if (!alex) throw new Error("Demo user @alex not found — run seed first");

  const existing = await prisma.repository.findFirst({
    where: { slug: REPO_SLUG, ownerId: alex.id },
  });
  if (existing) {
    await prisma.comment.deleteMany({ where: { document: { repositoryId: existing.id } } });
    await prisma.document.deleteMany({ where: { repositoryId: existing.id } });
    await prisma.folder.deleteMany({ where: { repositoryId: existing.id } });
    await prisma.repository.delete({ where: { id: existing.id } });
  }

  const repo = await prisma.repository.create({
    data: {
      name: "Cursor Skills Universal",
      slug: REPO_SLUG,
      description:
        "Universal Cursor Agent Skills for dense, correct code and lower token use — mirrored from GitHub.",
      visibility: "PUBLIC",
      ownerId: alex.id,
    },
  });

  const folderIds = new Map<string, string>();
  const usedSlugs = new Set<string>();

  const ensureFolder = async (relPath: string, parentId: string | null, sortOrder: number) => {
    const cached = folderIds.get(relPath);
    if (cached) return cached;
    const name = path.basename(relPath);
    const folder = await prisma.folder.create({
      data: { name, slug: slugify(name), repositoryId: repo.id, parentId, sortOrder },
    });
    folderIds.set(relPath, folder.id);
    return folder.id;
  };

  const uniqueSlug = (base: string) => {
    let slug = slugify(base);
    let i = 2;
    while (usedSlugs.has(slug)) slug = `${slugify(base)}-${i++}`;
    usedSlugs.add(slug);
    return slug;
  };

  const importDoc = async (
    filePath: string,
    relPath: string,
    folderId: string | null,
    title: string,
    slugBase: string,
    content: string
  ) => {
    await prisma.document.create({
      data: {
        title,
        slug: uniqueSlug(slugBase),
        content,
        excerpt: excerptFrom(content),
        readingMinutes: calcReadingMinutes(content),
        readerCount: Math.floor(Math.random() * 5000) + 500,
        repositoryId: repo.id,
        folderId,
        authorId: alex.id,
      },
    });
  };

  const walk = async (dir: string, relDir: string, parentFolderId: string | null) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    let sortOrder = 0;

    for (const entry of entries) {
      if (entry.name === ".git") continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = relDir ? `${relDir}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        const folderId = await ensureFolder(relPath, parentFolderId, sortOrder++);
        await walk(fullPath, relPath, folderId);
        continue;
      }

      if (/\.(md|mdc)$/i.test(entry.name)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        const title =
          entry.name === "README.md"
            ? relDir ? `${titleFromName(path.basename(relDir))} README` : "README"
            : entry.name === "SKILL.md"
              ? titleFromName(path.basename(relDir))
              : titleFromName(entry.name.replace(/\.(md|mdc)$/i, ""));
        const slugBase =
          entry.name === "SKILL.md"
            ? path.basename(relDir)
            : entry.name === "README.md"
              ? relDir ? `${path.basename(relDir)}-readme` : "readme"
              : entry.name.replace(/\.(md|mdc)$/i, "");
        await importDoc(fullPath, relPath, parentFolderId, title, slugBase, content);
        continue;
      }

      if (entry.name === "LICENSE") {
        const content = `# License\n\n\`\`\`\n${fs.readFileSync(fullPath, "utf-8")}\n\`\`\``;
        await importDoc(fullPath, relPath, parentFolderId, "License", "license", content);
        continue;
      }

      if (entry.name === "index.html") {
        const content = `# Visual Overview

Interactive overview of how Cursor Skills Universal changes a project.

- [GitHub Pages demo](https://aresiddharthareddy.github.io/Cursor-Skills-universal/)
- [Source repository](https://github.com/aresiddharthareddy/Cursor-Skills-universal)

> Open \`docs/index.html\` from the cloned repo in a browser for the full interactive experience.
`;
        await importDoc(fullPath, relPath, parentFolderId, "Visual Overview", "visual-overview", content);
      }
    }
  };

  await walk(REPO_DIR, "", null);

  const count = await prisma.document.count({ where: { repositoryId: repo.id } });
  console.log(`✅ Imported Cursor Skills Universal (${count} documents)`);
  console.log(`   → http://localhost:3000/r/alex/${REPO_SLUG}/readme`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
