import type { PublicationRole } from "@prisma/client";

const ROLE_RANK: Record<PublicationRole, number> = {
  OWNER: 5,
  ADMIN: 4,
  EDITOR: 3,
  WRITER: 2,
  CONTRIBUTOR: 1,
};

export function roleAtLeast(role: PublicationRole, minimum: PublicationRole) {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function canManagePublication(role: PublicationRole) {
  return roleAtLeast(role, "ADMIN");
}

export function canEditPublicationSettings(role: PublicationRole) {
  return roleAtLeast(role, "ADMIN");
}

export function canManageMembers(role: PublicationRole) {
  return roleAtLeast(role, "ADMIN");
}

export function canPublishArticle(role: PublicationRole) {
  return roleAtLeast(role, "WRITER");
}

export function canEditArticle(role: PublicationRole) {
  return roleAtLeast(role, "WRITER");
}

export function canInviteRole(actorRole: PublicationRole, targetRole: PublicationRole) {
  if (actorRole === "OWNER") return targetRole !== "OWNER";
  if (actorRole === "ADMIN") return roleAtLeast(targetRole, "CONTRIBUTOR") && targetRole !== "OWNER";
  return false;
}

export function canChangeMemberRole(actorRole: PublicationRole, current: PublicationRole, next: PublicationRole) {
  if (current === "OWNER" || next === "OWNER") return false;
  if (actorRole === "OWNER") return true;
  if (actorRole === "ADMIN") return roleAtLeast(current, "CONTRIBUTOR") && roleAtLeast(next, "CONTRIBUTOR");
  return false;
}

export function canRemoveMember(actorRole: PublicationRole, targetRole: PublicationRole) {
  if (targetRole === "OWNER") return false;
  if (actorRole === "OWNER") return true;
  if (actorRole === "ADMIN") return roleAtLeast(targetRole, "CONTRIBUTOR");
  return false;
}
