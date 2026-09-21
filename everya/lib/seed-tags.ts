import { PrismaClient } from "@prisma/client";
import { slugify } from "@/lib/utils";

const TAGS_BY_DOC_SLUG: Record<string, string[]> = {
  "getting-started": ["guides", "onboarding", "platform"],
  "api-design": ["api", "engineering", "best-practices"],
  "k8s-incident-runbook": ["kubernetes", "sre", "runbooks"],
  observability: ["observability", "monitoring", "sre"],
  "allocator-internals": ["systems", "research", "performance"],
  readme: ["cursor", "skills", "productivity"],
  license: ["open-source"],
  "smart-code-core": ["cursor", "ai", "engineering"],
  "token-efficient-exploration": ["cursor", "ai", "workflow"],
  "minimal-diff": ["engineering", "best-practices"],
  "dense-implementation": ["engineering", "patterns"],
  "reuse-before-create": ["architecture", "engineering"],
  "concise-output": ["communication", "workflow"],
  "small-model-discipline": ["ai", "workflow"],
  "smart-code-always": ["cursor", "rules"],
  "visual-overview": ["cursor", "design"],
};

export async function ensureTags(prisma: PrismaClient) {
  const tagNames = new Set<string>();
  for (const names of Object.values(TAGS_BY_DOC_SLUG)) {
    for (const name of names) tagNames.add(name);
  }

  const tagMap = new Map<string, string>();
  for (const name of tagNames) {
    const slug = slugify(name);
    const tag = await prisma.tag.upsert({
      where: { slug },
      create: { name, slug },
      update: {},
    });
    tagMap.set(name, tag.id);
  }

  const docs = await prisma.document.findMany({ select: { id: true, slug: true } });
  for (const doc of docs) {
    const names = TAGS_BY_DOC_SLUG[doc.slug] ?? ["engineering"];
    for (const name of names) {
      const tagId = tagMap.get(name);
      if (!tagId) continue;
      await prisma.documentTag.upsert({
        where: { documentId_tagId: { documentId: doc.id, tagId } },
        create: { documentId: doc.id, tagId },
        update: {},
      });
    }
  }
}
