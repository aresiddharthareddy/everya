import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Surface } from "@/components/ui/surface";
import { TagPills } from "@/components/docs/tag-pills";
import { FollowButton } from "@/components/social/follow-button";
import { formatUsername } from "@/lib/utils";

export function ExploreSidebar({
  tags,
  activeTag,
  suggestedAuthors,
  followingSet,
  session,
  collections,
}: {
  tags: { name: string; slug: string; count?: number }[];
  activeTag?: string;
  suggestedAuthors: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
    _count: { documents: number; followers: number };
  }[];
  followingSet: Set<string>;
  session: { user: { id: string } } | null;
  collections: {
    id: string;
    name: string;
    slug: string;
    owner: { username: string; name: string | null };
    _count: { documents: number };
  }[];
}) {
  return (
    <aside className="space-y-6 lg:pt-4">
      <Surface variant="bordered" padding="md">
        <h2 className="typo-caption mb-4">Topics</h2>
        <TagPills tags={tags.slice(0, 12)} activeSlug={activeTag} />
      </Surface>

      {suggestedAuthors.length > 0 && (
        <Surface variant="bordered" padding="md">
          <h2 className="typo-caption mb-4">Authors to follow</h2>
          <ul className="space-y-4">
            {suggestedAuthors.map((author) => (
              <li key={author.id} className="flex items-start gap-3">
                <Link href={`/u/${author.username}`} aria-label={author.name || author.username}>
                  <Avatar src={author.image} name={author.name || author.username} size="sm" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/u/${author.username}`} className="typo-nav hover:underline truncate block">
                    {author.name || formatUsername(author.username)}
                  </Link>
                  <p className="typo-meta">
                    {author._count.documents} articles · {author._count.followers} followers
                  </p>
                </div>
                <FollowButton
                  username={author.username}
                  initialFollowing={followingSet.has(author.id)}
                  signedIn={!!session}
                  isSelf={session?.user.id === author.id}
                />
              </li>
            ))}
          </ul>
        </Surface>
      )}

      {collections.length > 0 && (
        <Surface variant="bordered" padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="typo-caption">Collections</h2>
            <Link href="/publications" className="typo-meta hover:text-foreground motion-fast">
              Publications →
            </Link>
          </div>
          <ul className="space-y-3">
            {collections.map((repo) => (
              <li key={repo.id}>
                <Link href={`/r/${repo.owner.username}/${repo.slug}`} className="block group">
                  <p className="typo-nav group-hover:underline">{repo.name}</p>
                  <p className="typo-meta">
                    {formatUsername(repo.owner.username)} · {repo._count.documents} documents
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Surface>
      )}
    </aside>
  );
}
