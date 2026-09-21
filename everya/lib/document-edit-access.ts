import { canEditTraceContent, getTraceRole } from "@/lib/permissions/trace";
import { canEditArticle } from "@/lib/permissions/publication";
import { getMemberRole } from "@/services/publications";

type EditableDocument = {
  authorId: string;
  repositoryId: string;
  publicationId: string | null;
};

export async function canUserEditDocument(doc: EditableDocument, userId: string) {
  if (doc.authorId === userId) return true;
  if (doc.publicationId) {
    const role = await getMemberRole(doc.publicationId, userId);
    return role ? canEditArticle(role) : false;
  }
  const role = await getTraceRole(doc.repositoryId, userId);
  return role ? canEditTraceContent(role) : false;
}
