import Link from "next/link";
import { ChevronRight, FolderGit2, Newspaper } from "lucide-react";
import { ContentTypeBadge } from "@/components/content/content-type-badge";
import type { ContentType } from "@/components/content/content-type-badge";

export function DocumentContext({
  contentType,
  publication,
  collection,
  className,
}: {
  contentType: ContentType;
  publication?: { name: string; handle: string } | null;
  collection?: { name: string; slug: string; ownerUsername: string } | null;
  className?: string;
}) {
  return (
    <nav aria-label="Content context" className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {publication && (
        <>
          <Link
            href={`/p/${publication.handle}`}
            className="inline-flex items-center gap-1.5 typo-meta text-foreground hover:underline underline-offset-4"
          >
            <Newspaper className="h-3.5 w-3.5" aria-hidden="true" />
            {publication.name}
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
        </>
      )}
      {collection && !publication && (
        <>
          <Link
            href={`/r/${collection.ownerUsername}/${collection.slug}`}
            className="inline-flex items-center gap-1.5 typo-meta text-foreground hover:underline underline-offset-4"
          >
            <FolderGit2 className="h-3.5 w-3.5" aria-hidden="true" />
            {collection.name}
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
        </>
      )}
      <ContentTypeBadge type={contentType} />
    </nav>
  );
}
