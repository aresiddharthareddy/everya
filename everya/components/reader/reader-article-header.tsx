import type { ReactNode } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Pencil } from "lucide-react";
import { DocumentContext } from "@/components/content/document-context";
import { AuthorIdentity } from "@/components/content/author-identity";
import { ContentMeta } from "@/components/content/content-meta";
import { EngagementStats } from "@/components/content/engagement-stats";
import { DocActions } from "@/components/docs/doc-actions";
import { ShareButton } from "@/components/social/share-button";
import { FollowButton } from "@/components/social/follow-button";
import { PublicationFollowButton } from "@/components/social/publication-follow-button";
import { TagPills } from "@/components/docs/tag-pills";
import { Button } from "@/components/ui/button";
import type { ContentType } from "@/components/content/content-type-badge";

export function ReaderArticleHeader({
  title,
  subtitle,
  coverImage,
  updatedAt,
  readingMinutes,
  contentType,
  publication,
  collection,
  trace,
  author,
  lastEditor,
  tags,
  stats,
  commentCount,
  documentId,
  engagement,
  follow,
  editHref,
  shareUrl,
  badge,
}: {
  title: string;
  subtitle?: string | null;
  coverImage?: string | null;
  updatedAt: Date;
  readingMinutes: number;
  contentType: ContentType;
  publication?: { name: string; handle: string } | null;
  collection?: { name: string; slug: string; ownerUsername: string } | null;
  trace?: { name: string; slug: string; ownerUsername: string } | null;
  author: { username: string; name: string | null; image: string | null };
  lastEditor?: { username: string; name: string | null } | null;
  tags?: { name: string; slug: string }[];
  stats: { readerCount: number; likeCount: number; avgRating: number; readingMinutes: number };
  commentCount: number;
  documentId: string;
  engagement: {
    liked: boolean;
    bookmarked: boolean;
    rating?: number;
    signedIn: boolean;
  };
  follow: {
    authorFollowing: boolean;
    isAuthor: boolean;
    publicationHandle?: string;
    publicationFollowing?: boolean;
  };
  editHref?: string;
  shareUrl?: string;
  badge?: ReactNode;
}) {
  return (
    <header data-doc-header className="mb-10">
      {tags && tags.length > 0 && <TagPills tags={tags} className="mb-5" />}

      <DocumentContext
        contentType={contentType}
        publication={publication}
        collection={collection}
        trace={trace}
        className="mb-4"
      />

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="typo-article-title text-[2.25rem] sm:text-[2.75rem]">{title}</h1>
        {badge}
      </div>
      {subtitle && <p className="typo-article-subtitle mt-4 max-w-2xl">{subtitle}</p>}

      {coverImage && (
        <div className="mt-8 overflow-hidden rounded-lg border border-border aspect-[16/9] max-h-[28rem]">
          <img src={coverImage} alt="" className="h-full w-full object-cover" loading="eager" decoding="async" />
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <AuthorIdentity
            size="md"
            name={author.name}
            username={author.username}
            image={author.image}
            href={`/u/${author.username}`}
            meta={formatDistanceToNow(updatedAt, { addSuffix: true })}
          />
          {lastEditor && lastEditor.username !== author.username && (
            <p className="typo-meta">
              Last edited by{" "}
              <Link href={`/u/${lastEditor.username}`} className="hover:text-foreground motion-fast">
                {lastEditor.name || `@${lastEditor.username}`}
              </Link>
            </p>
          )}
          <ContentMeta items={[`${readingMinutes} min read`]} />
        </div>
        <div className="flex flex-wrap gap-2">
          <FollowButton
            username={author.username}
            initialFollowing={follow.authorFollowing}
            signedIn={engagement.signedIn}
            isSelf={follow.isAuthor}
          />
          {follow.publicationHandle && (
            <PublicationFollowButton
              handle={follow.publicationHandle}
              initialFollowing={follow.publicationFollowing ?? false}
              signedIn={engagement.signedIn}
            />
          )}
        </div>
      </div>

      <EngagementStats
        className="mt-6"
        stats={{
          readerCount: stats.readerCount,
          likeCount: stats.likeCount,
          commentCount,
          avgRating: stats.avgRating,
          readingMinutes: stats.readingMinutes,
        }}
      />

      <div className="mt-6 flex flex-wrap items-center gap-3 pb-8 border-b border-border">
        <DocActions
          documentId={documentId}
          initialLiked={engagement.liked}
          initialBookmarked={engagement.bookmarked}
          initialRating={engagement.rating}
          likeCount={stats.likeCount}
          signedIn={engagement.signedIn}
        />
        <ShareButton url={shareUrl} title={title} />
        {editHref && (
          <Link href={editHref}>
            <Button variant="outline" size="sm">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
