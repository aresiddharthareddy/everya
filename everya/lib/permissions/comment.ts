import type { PublicationRole, TraceRole } from "@prisma/client";
import { canEditArticle } from "@/lib/permissions/publication";
import { canEditTraceContent } from "@/lib/permissions/trace";

export function canModerateDocumentComments(
  userId: string,
  document: { authorId: string },
  opts: {
    traceRole?: TraceRole | "OWNER" | null;
    publicationRole?: PublicationRole | null;
  }
) {
  if (document.authorId === userId) return true;
  if (opts.traceRole && canEditTraceContent(opts.traceRole)) return true;
  if (opts.publicationRole && canEditArticle(opts.publicationRole)) return true;
  return false;
}

export function canDeleteComment(
  userId: string,
  comment: { authorId: string },
  canModerate: boolean
) {
  return comment.authorId === userId || canModerate;
}
