type DraftDoc = {
  id: string;
  slug: string;
  publicationId: string | null;
  publication?: { handle: string } | null;
  repository: { slug: string; owner: { username: string } };
};

export function draftEditHref(doc: DraftDoc) {
  if (doc.publicationId && doc.publication) {
    return `/p/${doc.publication.handle}/write?id=${doc.id}`;
  }
  return `/u/${doc.repository.owner.username}/trace/${doc.repository.slug}/${doc.slug}/edit`;
}
