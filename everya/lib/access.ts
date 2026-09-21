export function canViewRepo(
  repo: { visibility: string; ownerId: string },
  userId?: string
) {
  if (repo.visibility === "PUBLIC") return true;
  return !!userId && userId === repo.ownerId;
}
