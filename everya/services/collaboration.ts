import { prisma } from "@/lib/prisma";
import { buildDocumentContributors } from "@/lib/contributors";
import { getTraceMembers } from "@/services/traces";

const userSelect = { id: true, username: true, name: true, image: true };

export async function getDocumentContributors(documentId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      author: { select: userSelect },
      lastEditedBy: { select: userSelect },
      revisions: {
        distinct: ["createdById"],
        select: { createdBy: { select: userSelect } },
      },
    },
  });
  if (!doc) return null;

  const editors = doc.revisions.map((r) => r.createdBy);
  return {
    author: doc.author,
    lastEditor: doc.lastEditedBy,
    contributors: buildDocumentContributors(doc.author, editors, doc.lastEditedBy),
  };
}

export async function getTraceContributorRoster(repositoryId: string) {
  const repo = await prisma.repository.findUnique({
    where: { id: repositoryId },
    select: {
      owner: { select: userSelect },
    },
  });
  if (!repo) return null;

  const members = await getTraceMembers(repositoryId);
  return {
    owner: { ...repo.owner, role: "OWNER" as const },
    members: members.map((m) => ({
      ...m.user,
      role: m.role,
    })),
  };
}
