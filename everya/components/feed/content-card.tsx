import Link from "next/link";
import { FolderGit2, Newspaper } from "lucide-react";
import { AuthorIdentity } from "@/components/content/author-identity";
import { ContentTypeBadge } from "@/components/content/content-type-badge";
import { EngagementStats } from "@/components/content/engagement-stats";
import { TagPills } from "@/components/docs/tag-pills";
import { Surface } from "@/components/ui/surface";
import type { ContentType } from "@/components/content/content-type-badge";

export type ContentCardVariant = "featured" | "standard" | "compact";

export type ContentCardData = {
  href: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;
  contentType: ContentType;
  author: {
    username: string;
    name?: string | null;
    image?: string | null;
  };
  publication?: {
    name: string;
    handle: string;
    logo?: string | null;
  } | null;
  collection?: {
    name: string;
    slug: string;
    ownerUsername: string;
  } | null;
  readingMinutes: number;
  readerCount: number;
  likeCount: number;
  commentCount: number;
  avgRating?: number;
  tags?: { name: string; slug: string }[];
};

function ContextLine({
  publication,
  collection,
  contentType,
}: {
  publication?: ContentCardData["publication"];
  collection?: ContentCardData["collection"];
  contentType: ContentType;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {publication ? (
        <Link
          href={`/p/${publication.handle}`}
          className="inline-flex items-center gap-1.5 typo-caption normal-case tracking-normal text-foreground hover:underline underline-offset-4"
        >
          <Newspaper className="h-3 w-3" aria-hidden="true" />
          {publication.name}
        </Link>
      ) : collection ? (
        <Link
          href={`/u/${collection.ownerUsername}/trace/${collection.slug}`}
          className="inline-flex items-center gap-1.5 typo-caption normal-case tracking-normal text-foreground hover:underline underline-offset-4"
        >
          <FolderGit2 className="h-3 w-3" aria-hidden="true" />
          {collection.name}
        </Link>
      ) : null}
      <ContentTypeBadge type={contentType} />
    </div>
  );
}

function CoverVisual({ src, variant }: { src?: string | null; variant: ContentCardVariant }) {
  if (!src) return null;
  const sizes =
    variant === "featured"
      ? "hidden sm:block w-36 lg:w-44 shrink-0 rounded-lg overflow-hidden aspect-[4/3]"
      : "hidden sm:block w-20 shrink-0 rounded-md overflow-hidden aspect-square";
  return (
    <div className={sizes}>
      <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
    </div>
  );
}

function CardTitle({
  href,
  title,
  variant,
}: {
  href: string;
  title: string;
  variant: ContentCardVariant;
}) {
  const className =
    variant === "featured"
      ? "font-serif text-2xl sm:text-[1.75rem] font-medium tracking-tight leading-tight mt-4 hover:underline underline-offset-4 decoration-border block text-foreground"
      : variant === "compact"
        ? "typo-nav mt-1 hover:underline underline-offset-4 block text-foreground"
        : "font-serif text-xl sm:text-2xl font-medium tracking-tight leading-snug mt-2 hover:underline underline-offset-4 decoration-border block text-foreground";
  return (
    <Link href={href} className={className}>
      {title}
    </Link>
  );
}

export function ContentCard({ data, variant = "standard" }: { data: ContentCardData; variant?: ContentCardVariant }) {
  if (variant === "compact") {
    return (
      <article className="surface-interactive border-b border-border/70 last:border-0">
        <div className="py-3 px-1">
          <ContextLine publication={data.publication} collection={data.collection} contentType={data.contentType} />
          <CardTitle href={data.href} title={data.title} variant="compact" />
          <p className="typo-meta mt-1">{data.readingMinutes} min</p>
        </div>
      </article>
    );
  }

  if (variant === "featured") {
    return (
      <article className="mb-10">
        <Surface variant="featured">
          <div className="p-6 sm:p-8">
            <div className="flex gap-6">
              <div className="flex-1 min-w-0">
                <ContextLine
                  publication={data.publication}
                  collection={data.collection}
                  contentType={data.contentType}
                />
                <div className="mt-4">
                  <AuthorIdentity
                    size="sm"
                    name={data.author.name}
                    username={data.author.username}
                    image={data.author.image}
                    href={`/u/${data.author.username}`}
                  />
                </div>
                <CardTitle href={data.href} title={data.title} variant="featured" />
                {data.subtitle && (
                  <p className="typo-article-subtitle mt-2 line-clamp-2">{data.subtitle}</p>
                )}
                {data.excerpt && (
                  <p className="typo-body-sm text-muted-foreground mt-3 line-clamp-3 max-w-2xl">{data.excerpt}</p>
                )}
                <EngagementStats
                  className="mt-5"
                  stats={{
                    readingMinutes: data.readingMinutes,
                    readerCount: data.readerCount,
                    likeCount: data.likeCount,
                    commentCount: data.commentCount,
                    avgRating: data.avgRating,
                  }}
                />
              </div>
              <CoverVisual src={data.coverImage} variant="featured" />
            </div>
          </div>
          {data.tags && data.tags.length > 0 && (
            <TagPills tags={data.tags.slice(0, 4)} className="px-6 sm:px-8 pb-6" />
          )}
        </Surface>
      </article>
    );
  }

  return (
    <article className="border-b border-border/70 last:border-0 py-6">
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <ContextLine
              publication={data.publication}
              collection={data.collection}
              contentType={data.contentType}
            />
            <span className="typo-meta shrink-0">{data.readingMinutes} min</span>
          </div>
          <CardTitle href={data.href} title={data.title} variant="standard" />
          {data.excerpt && (
            <p className="typo-body-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{data.excerpt}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <AuthorIdentity
              size="sm"
              name={data.author.name}
              username={data.author.username}
              image={data.author.image}
              href={`/u/${data.author.username}`}
            />
            <EngagementStats
              variant="compact"
              stats={{
                readerCount: data.readerCount,
                likeCount: data.likeCount,
                commentCount: data.commentCount,
                avgRating: data.avgRating,
              }}
            />
          </div>
          {data.tags && data.tags.length > 0 && (
            <TagPills tags={data.tags.slice(0, 3)} className="mt-3" />
          )}
        </div>
        <CoverVisual src={data.coverImage} variant="standard" />
      </div>
    </article>
  );
}
