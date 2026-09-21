import type { TraceRole } from "@prisma/client";

const ROLE_RANK: Record<TraceRole | "OWNER", number> = {
  OWNER: 3,
  EDITOR: 2,
  CONTRIBUTOR: 1,
};

export function traceRoleAtLeast(role: TraceRole | "OWNER", minimum: TraceRole | "OWNER") {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function canEditTraceContent(role: TraceRole | "OWNER") {
  return traceRoleAtLeast(role, "CONTRIBUTOR");
}

export function canManageTraceSettings(role: TraceRole | "OWNER") {
  return traceRoleAtLeast(role, "EDITOR");
}

export function canManageTraceMembers(role: TraceRole | "OWNER") {
  return role === "OWNER";
}

import { prisma } from "@/lib/prisma";

export async function getTraceRole(
  repositoryId: string,
  userId: string
): Promise<TraceRole | "OWNER" | null> {
  const repo = await prisma.repository.findUnique({
    where: { id: repositoryId },
    select: { ownerId: true },
  });
  if (!repo) return null;
  if (repo.ownerId === userId) return "OWNER";
  const member = await prisma.traceMember.findUnique({
    where: { repositoryId_userId: { repositoryId, userId } },
    select: { role: true },
  });
  return member?.role ?? null;
}
