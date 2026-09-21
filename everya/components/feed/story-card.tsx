import Link from "next/link";
import { formatUsername, formatCount } from "@/lib/utils";
import { TagPills } from "@/components/docs/tag-pills";

export function StoryCard({
  href,
  title,
  excerpt,
  authorName,
  authorUsername,
  repoName,
  readingMinutes,
  readerCount,
  tags,
}: {
  href: string;
  title: string;
  excerpt?: string | null;
  authorName?: string | null;
  authorUsername: string;
  repoName: string;
  readingMinutes: number;
  readerCount: number;
  tags?: { name: string; slug: string }[];
}) {
  return (
    <article className="group">
      <Link href={href} className="block">
        <p className="text-xs text-muted-foreground">
          {authorName || formatUsername(authorUsername)} · {repoName}
        </p>
        <h3 className="mt-1.5 font-serif text-2xl sm:text-[1.65rem] tracking-tight leading-snug group-hover:underline underline-offset-4 decoration-foreground/30">
          {title}
        </h3>
        {excerpt && (
          <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">{excerpt}</p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          {readingMinutes} min read · {formatCount(readerCount)} readers
        </p>
      </Link>
      {tags && tags.length > 0 && <TagPills tags={tags} className="mt-3" />}
    </article>
  );
}
