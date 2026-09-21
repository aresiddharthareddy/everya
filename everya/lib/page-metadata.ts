import type { Metadata } from "next";

export function documentPageMetadata(
  doc: {
    title: string;
    excerpt?: string | null;
    subtitle?: string | null;
    coverImage?: string | null;
  },
  canonicalPath: string
): Metadata {
  const description = doc.excerpt || doc.subtitle || undefined;
  return {
    title: doc.title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: doc.title,
      description,
      type: "article",
      url: canonicalPath,
      images: doc.coverImage ? [{ url: doc.coverImage }] : undefined,
    },
  };
}
