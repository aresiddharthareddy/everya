type DocumentHrefInput = {
  slug: string;
  publicationId: string | null;
  publication?: { handle: string } | null;
  repository: { slug: string; owner: { username: string } };
};

export function documentReaderHref(doc: DocumentHrefInput) {
  if (doc.publicationId && doc.publication) {
    return `/p/${doc.publication.handle}/${doc.slug}`;
  }
  return `/u/${doc.repository.owner.username}/trace/${doc.repository.slug}/${doc.slug}`;
}
