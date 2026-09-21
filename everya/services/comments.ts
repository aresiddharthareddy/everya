import { prisma } from "@/lib/prisma";
import { canDeleteComment, canModerateDocumentComments } from "@/lib/permissions/comment";
import { getMemberRole } from "@/services/publications";
import { getTraceRole } from "@/lib/permissions/trace";

export async function deleteComment(commentId: string, userId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      document: {
        select: {
          authorId: true,
          publicationId: true,
          repositoryId: true,
        },
      },
    },
  });
  if (!comment) return null;

  const traceRole = comment.document.publicationId
    ? null
    : await getTraceRole(comment.document.repositoryId, userId);
  const publicationRole =
    comment.document.publicationId && comment.document.publicationId
      ? await getMemberRole(comment.document.publicationId, userId)
      : null;

  const canModerate = canModerateDocumentComments(userId, comment.document, {
    traceRole,
    publicationRole,
  });
  if (!canDeleteComment(userId, comment, canModerate)) return null;

  await prisma.comment.delete({ where: { id: commentId } });
  return { ok: true };
}
