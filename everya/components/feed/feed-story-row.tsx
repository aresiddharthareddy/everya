import Link from "next/link";
import { formatUsername, formatCount, formatRating } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { TagPills } from "@/components/docs/tag-pills";
import { Heart, MessageCircle, Eye, Star } from "lucide-react";

export function FeedStoryRow({
  href,
  title,
  excerpt,
  authorName,
  authorUsername,
  authorImage,
  readingMinutes,
  readerCount,
  likeCount,
  commentCount,
  avgRating,
  tags,
  featured,
}: {
  href: string;
  title: string;
  excerpt?: string | null;
  authorName?: string | null;
  authorUsername: string;
  authorImage?: string | null;
  readingMinutes: number;
  readerCount: number;
  likeCount: number;
  commentCount: number;
  avgRating: number;
  tags?: { name: string; slug: string }[];
  featured?: boolean;
}) {
  if (featured) {
    return (
      <article className="feed-hero group mb-12">
        <Link href={href} className="feed-hero-inner block p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-5">
            <Avatar src={authorImage} name={authorName || authorUsername} />
            <div>
              <p className="text-sm font-medium">{authorName || formatUsername(authorUsername)}</p>
              <p className="text-xs text-muted-foreground">Featured story</p>
            </div>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl tracking-tight leading-[1.1] max-w-2xl group-hover:underline underline-offset-4">
            {title}
          </h2>
          {excerpt && <p className="mt-4 text-base text-muted-foreground leading-relaxed line-clamp-3 max-w-xl">{excerpt}</p>}
          <FeedStats
            readerCount={readerCount}
            likeCount={likeCount}
            commentCount={commentCount}
            avgRating={avgRating}
            readingMinutes={readingMinutes}
            className="mt-6"
          />
        </Link>
        {tags && tags.length > 0 && <TagPills tags={tags.slice(0, 3)} className="px-8 sm:px-10 pb-8" />}
      </article>
    );
  }

  return (
    <article className="feed-row group">
      <Link href={href} className="flex gap-5 py-6">
        <Avatar src={authorImage} name={authorName || authorUsername} className="shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{authorName || formatUsername(authorUsername)}</p>
          <h3 className="mt-1 font-serif text-xl sm:text-2xl tracking-tight leading-snug group-hover:underline underline-offset-4">
            {title}
          </h3>
          {excerpt && <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">{excerpt}</p>}
          <FeedStats
            readerCount={readerCount}
            likeCount={likeCount}
            commentCount={commentCount}
            avgRating={avgRating}
            readingMinutes={readingMinutes}
            className="mt-3"
          />
        </div>
        <div className="hidden sm:block w-28 h-28 shrink-0 rounded-xl feed-thumb" aria-hidden />
      </Link>
      {tags && tags.length > 0 && <TagPills tags={tags.slice(0, 2)} className="pb-4" />}
    </article>
  );
}

function FeedStats({
  readerCount,
  likeCount,
  commentCount,
  avgRating,
  readingMinutes,
  className,
}: {
  readerCount: number;
  likeCount: number;
  commentCount: number;
  avgRating: number;
  readingMinutes: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground ${className || ""}`}>
      <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{formatCount(readerCount)}</span>
      <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{formatCount(likeCount)}</span>
      <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{commentCount}</span>
      {avgRating > 0 && (
        <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" />{formatRating(avgRating)}</span>
      )}
      <span>{readingMinutes} min</span>
    </div>
  );
}
