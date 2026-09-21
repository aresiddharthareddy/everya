import { documentReaderHref } from "@/lib/document-href";

export function personHref(username: string) {
  return `/u/${username.replace(/^@/, "")}`;
}

export function publicationHref(handle: string) {
  return `/p/${handle}`;
}

export function tracePageHref(username: string, slug: string) {
  return `/u/${username.replace(/^@/, "")}/trace/${slug}`;
}

export function repositoryHref(
  repo: {
    slug: string;
    owner: { username: string };
    publication?: { handle: string } | null;
  }
) {
  if (repo.publication) return publicationHref(repo.publication.handle);
  return tracePageHref(repo.owner.username, repo.slug);
}

export { documentReaderHref };

export function documentSharePath(
  doc: {
    slug: string;
    publicationId: string | null;
    publication?: { handle: string } | null;
    repository: { slug: string; owner: { username: string } };
  },
  hash?: string
) {
  const base = documentReaderHref(doc);
  return hash ? `${base}#${hash}` : base;
}
