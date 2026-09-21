import { ContentCard, type ContentCardData } from "@/components/feed/content-card";
import { articleHref } from "@/services/feed";

export type FeedDocument = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt: string | null;
  coverImage?: string | null;
  readingMinutes: number;
  readerCount: number;
  author: { username: string; name: string | null; image: string | null };
  publication: { handle: string; name: string; logo?: string | null } | null;
  repository: { slug: string; name: string; owner: { username: string } };
  tags: { tag: { name: string; slug: string } }[];
  _count: { likes: number; comments: number };
  ratings?: { value: number }[];
};

function avgRating(values: { value: number }[] = []) {
  if (!values.length) return 0;
  return values.reduce((s, r) => s + r.value, 0) / values.length;
}

export function toContentCardData(doc: FeedDocument): ContentCardData {
  const hasPublication = !!doc.publication;
  return {
    href: articleHref(doc),
    title: doc.title,
    subtitle: doc.subtitle,
    excerpt: doc.excerpt,
    coverImage: doc.coverImage,
    contentType: hasPublication ? "article" : "document",
    author: doc.author,
    publication: doc.publication,
    collection: hasPublication
      ? null
      : {
          name: doc.repository.name,
          slug: doc.repository.slug,
          ownerUsername: doc.repository.owner.username,
        },
    readingMinutes: doc.readingMinutes,
    readerCount: doc.readerCount,
    likeCount: doc._count.likes,
    commentCount: doc._count.comments,
    avgRating: avgRating(doc.ratings),
    tags: doc.tags.map((t) => t.tag),
  };
}

export function FeedDocumentCard({
  doc,
  variant = "standard",
}: {
  doc: FeedDocument;
  variant?: "featured" | "standard" | "compact";
}) {
  return <ContentCard data={toContentCardData(doc)} variant={variant} />;
}
