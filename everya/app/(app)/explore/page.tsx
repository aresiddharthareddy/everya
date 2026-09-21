import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { getForYouFeed, getFollowingFeed, getLatestFeed, getTrendingFeed, articleHref } from "@/services/feed";
import { formatUsername } from "@/lib/utils";
import { ExploreTabs, type ExploreTab } from "@/components/feed/explore-tabs";
import { FeedStoryRow } from "@/components/feed/feed-story-row";
import { TagPills } from "@/components/docs/tag-pills";
import { Avatar } from "@/components/ui/avatar";
import { FollowButton } from "@/components/social/follow-button";
import { EmptyState } from "@/components/everya/empty-state";

const feedInclude = {
  author: { select: { username: true, name: true, image: true } },
  publication: { select: { id: true, handle: true, name: true, logo: true } },
  repository: { select: { name: true, slug: true, owner: { select: { username: true } } } },
  tags: { include: { tag: { select: { name: true, slug: true } } } },
  ratings: { select: { value: true } },
  _count: { select: { likes: true, comments: true } },
} as const;

type ExploreDoc = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  readingMinutes: number;
  readerCount: number;
  author: { username: string; name: string | null; image: string | null };
  publication: { handle: string; name: string } | null;
  repository: { slug: string; name: string; owner: { username: string } };
  tags: { tag: { name: string; slug: string } }[];
  _count: { likes: number; comments: number };
  ratings?: { value: number }[];
};

function avgRating(values: { value: number }[]) {
  if (!values.length) return 0;
  return values.reduce((s, r) => s + r.value, 0) / values.length;
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; tag?: string }>;
}) {
  const { tab: rawTab, tag } = await searchParams;
  const tab = (["for-you", "trending", "latest", "following"].includes(rawTab || "")
    ? rawTab
    : "trending") as ExploreTab;
  const session = await getServerSession();

  const [tags, repos, suggestedAuthors] = await Promise.all([
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { documents: true } } },
    }),
    prisma.repository.findMany({
      where: { visibility: "PUBLIC" },
      include: { owner: { select: { username: true, name: true } }, _count: { select: { documents: true } } },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.user.findMany({
      where: session ? { NOT: { id: session.user.id } } : undefined,
      take: 4,
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        bio: true,
        _count: { select: { documents: true, followers: true } },
      },
      orderBy: { documents: { _count: "desc" } },
    }),
  ]);

  let docs: ExploreDoc[] = [];
  let forYouEmpty = false;

  if (tag) {
    docs = await prisma.document.findMany({
      where: {
        status: "PUBLISHED",
        tags: { some: { tag: { slug: tag } } },
        OR: [
          { publication: { visibility: "PUBLIC" } },
          { publicationId: null, repository: { visibility: "PUBLIC" } },
        ],
      },
      orderBy: tab === "latest" || tab === "following" ? { updatedAt: "desc" } : { readerCount: "desc" },
      take: 20,
      include: feedInclude,
    });
  } else if (tab === "for-you") {
    if (session) {
      const [userFollows, pubFollows] = await Promise.all([
        prisma.userFollow.count({ where: { followerId: session.user.id } }),
        prisma.publicationFollow.count({ where: { userId: session.user.id } }),
      ]);
      if (userFollows + pubFollows === 0) forYouEmpty = true;
      else docs = (await getForYouFeed(session.user.id)) as ExploreDoc[];
    }
  } else if (tab === "following") {
    if (session) docs = (await getFollowingFeed(session.user.id)) as ExploreDoc[];
  } else if (tab === "latest") {
    docs = (await getLatestFeed(session?.user.id)) as ExploreDoc[];
  } else {
    docs = (await getTrendingFeed(session?.user.id)) as ExploreDoc[];
  }

  const tagList = tags.map((t) => ({ name: t.name, slug: t.slug, count: t._count.documents }));
  const [featured, ...rest] = docs;

  const followingSet = session
    ? new Set(
        (
          await prisma.userFollow.findMany({
            where: { followerId: session.user.id },
            select: { followingId: true },
          })
        ).map((f) => f.followingId)
      )
    : new Set<string>();

  const showFeed = !(tab === "for-you" && (!session || forYouEmpty)) && !(tab === "following" && !session);

  return (
    <div className="min-h-full bg-muted/15">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8 sm:py-12">
        <div className="grid lg:grid-cols-[1fr_300px] gap-10 lg:gap-14">
          <div>
            <header className="mb-8">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Discover</p>
              <h1 className="font-serif text-3xl sm:text-4xl tracking-tight">Stories for you</h1>
            </header>

            <ExploreTabs active={tab} tag={tag} />

            {tab === "for-you" && !session && (
              <div className="mt-8 stat-card p-8 text-center">
                <p className="text-sm text-muted-foreground">Sign in for a personalized feed.</p>
                <Link
                  href="/login?next=/explore?tab=for-you"
                  className="inline-block mt-4 text-sm font-medium px-5 py-2 rounded-full bg-foreground text-background"
                >
                  Sign in
                </Link>
              </div>
            )}

            {tab === "for-you" && session && forYouEmpty && (
              <div className="mt-8">
                <EmptyState
                  title="Your feed is empty"
                  description="Follow authors and publications to personalize For You."
                  actionLabel="Create a publication"
                  actionHref="/publications/new"
                />
              </div>
            )}

            {tab === "following" && !session && (
              <div className="mt-8 stat-card p-8 text-center">
                <p className="text-sm text-muted-foreground">Sign in to see stories from authors you follow.</p>
                <Link
                  href="/login?next=/explore?tab=following"
                  className="inline-block mt-4 text-sm font-medium px-5 py-2 rounded-full bg-foreground text-background"
                >
                  Sign in
                </Link>
              </div>
            )}

            {showFeed && (
              <section className="mt-8 divide-y divide-border/60">
                {docs.length === 0 ? (
                  <p className="py-12 text-sm text-muted-foreground text-center">
                    {tab === "following" ? "Follow authors to build your personalized feed." : "No stories match this filter."}
                  </p>
                ) : (
                  <>
                    {featured && tab === "trending" && !tag && (
                      <FeedStoryRow
                        featured
                        href={articleHref(featured)}
                        title={featured.title}
                        excerpt={featured.excerpt}
                        authorName={featured.author.name}
                        authorUsername={featured.author.username}
                        authorImage={featured.author.image}
                        readingMinutes={featured.readingMinutes}
                        readerCount={featured.readerCount}
                        likeCount={featured._count.likes}
                        commentCount={featured._count.comments}
                        avgRating={avgRating(featured.ratings ?? [])}
                        tags={featured.tags.map((t) => t.tag)}
                      />
                    )}
                    {(tab === "trending" && !tag ? rest : docs).map((doc) => (
                      <FeedStoryRow
                        key={doc.id}
                        href={articleHref(doc)}
                        title={doc.title}
                        excerpt={doc.excerpt}
                        authorName={doc.author.name}
                        authorUsername={doc.author.username}
                        authorImage={doc.author.image}
                        readingMinutes={doc.readingMinutes}
                        readerCount={doc.readerCount}
                        likeCount={doc._count.likes}
                        commentCount={doc._count.comments}
                        avgRating={avgRating(doc.ratings ?? [])}
                        tags={doc.tags.map((t) => t.tag)}
                      />
                    ))}
                  </>
                )}
              </section>
            )}
          </div>

          <aside className="space-y-8 lg:pt-16">
            <div className="stat-card p-5">
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Topics</h2>
              <TagPills tags={tagList.slice(0, 12)} activeSlug={tag} />
            </div>

            {suggestedAuthors.length > 0 && (
              <div className="stat-card p-5">
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Who to follow</h2>
                <ul className="space-y-4">
                  {suggestedAuthors.map((author) => (
                    <li key={author.id} className="flex items-start gap-3">
                      <Link href={`/u/${author.username}`}>
                        <Avatar src={author.image} name={author.name || author.username} size="sm" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/u/${author.username}`} className="text-sm font-medium hover:underline truncate block">
                          {author.name || formatUsername(author.username)}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {author._count.documents} stories · {author._count.followers} followers
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
              </div>
            )}

            {repos.length > 0 && (
              <div className="stat-card p-5">
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Collections</h2>
                <ul className="space-y-3">
                  {repos.map((repo) => (
                    <li key={repo.id}>
                      <Link href={`/r/${repo.owner.username}/${repo.slug}`} className="block group">
                        <p className="text-sm font-medium group-hover:underline">{repo.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatUsername(repo.owner.username)} · {repo._count.documents} stories
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
