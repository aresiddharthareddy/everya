export type RepositoryAction = "view" | "edit" | "delete" | "manage";

/** Publication RBAC expands in Phase 2. */
export type PublicationRole =
  | "OWNER"
  | "ADMIN"
  | "EDITOR"
  | "WRITER"
  | "CONTRIBUTOR"
  | "REVIEWER";
