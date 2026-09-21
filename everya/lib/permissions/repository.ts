import { canViewRepo } from "@/lib/access";
import type { RepositoryAction } from "./types";

type RepoRef = { visibility: string; ownerId: string };

export function canPerformRepositoryAction(
  action: RepositoryAction,
  repo: RepoRef,
  userId?: string
): boolean {
  switch (action) {
    case "view":
      return canViewRepo(repo, userId);
    case "edit":
    case "delete":
    case "manage":
      return !!userId && userId === repo.ownerId;
    default:
      return false;
  }
}

export { canViewRepo };
