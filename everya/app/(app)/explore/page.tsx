import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { getForYouFeed, getFollowingFeed, getLatestFeed, getTrendingFeed } from "@/services/feed";
import { ExploreTabs, type ExploreTab } from "@/components/feed/explore-tabs";
import { FeedDocumentCard, type FeedDocument } from "@/components/feed/feed-document-card";
import { ExploreSidebar } from "@/components/feed/explore-sidebar";
import { EmptyState } from "@/components/everya/empty-state";
import { PageHeader } from "@/components/navigation/page-header";

const feedInclude = {
  author: { select: { username: true, name: true, image: true } },
  publication: { select: { id: true, handle: true, name: true, logo: true } },
  repository: { select: { name: true, slug: true, owner: { select: { username: true } } } },
  tags: { include: { tag: { select: { name: true, slug: true } } } },
  ratings: { select: { value: true } },
  _count: { select: { likes: true, comments: true } },
  subtitle: true,
  coverImage: true,
} as const;

const TAB_COPY: Record<ExploreTab, { title: string; description: string }> = {
  "for-you": {
    title: "For You",
    description: "Personalized articles from authors and publications you follow.",
  },
  following: {
    title: "Following",
    description: "Latest from people and publications in your network.",
  },
  latest: {
    title: "Latest",
    description: "Recently published articles and documents across EveryA.",
  },
  trending: {
    title: "Trending",
    description: "What readers are engaging with this week.",
  },
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; tag?: string }>;
}) {
  const { tab: rawTab, tag } = await searchParams;
  const session = await getServerSession();
  const defaultTab = session ? "for-you" : "trending";
  const tab = (["for-you", "trending", "latest", "following"].includes(rawTab || "")
    ? rawTab
    : defaultTab) as ExploreTab;

  const [tags, repos, suggestedAuthors] = await Promise.all([
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { documents: true } } },
    }),
    prisma.repository.findMany({
      where: { visibility: "PUBLIC", publication: null },
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

  let docs: FeedDocument[] = [];
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
    }) as FeedDocument[];
  } else if (tab === "for-you") {
    if (session) {
      const [userFollows, pubFollows] = await Promise.all([
        prisma.userFollow.count({ where: { followerId: session.user.id } }),
        prisma.publicationFollow.count({ where: { userId: session.user.id } }),
      ]);
      if (userFollows + pubFollows === 0) forYouEmpty = true;
      else docs = (await getForYouFeed(session.user.id)) as FeedDocument[];
    }
  } else if (tab === "following") {
    if (session) docs = (await getFollowingFeed(session.user.id)) as FeedDocument[];
  } else if (tab === "latest") {
    docs = (await getLatestFeed(session?.user.id)) as FeedDocument[];
  } else {
    docs = (await getTrendingFeed(session?.user.id)) as FeedDocument[];
  }

  const tagList = tags.map((t) => ({ name: t.name, slug: t.slug, count: t._count.documents }));
  const [featured, ...rest] = docs;
  const showFeatured = featured && !tag && (tab === "trending" || tab === "for-you");
  const feedDocs = showFeatured ? rest : docs;

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
  const copy = tag
    ? { title: `Topic: ${tagList.find((t) => t.slug === tag)?.name || tag}`, description: "Articles and documents tagged with this topic." }
    : TAB_COPY[tab];

  return (
    <div className="min-h-full bg-muted/15">
      <div className="page-container py-page max-w-6xl">
        <div className="grid lg:grid-cols-[1fr_300px] gap-10 lg:gap-14">
          <div>
            <PageHeader
              className="mb-8"
              eyebrow={tag ? "Topic" : "Discover"}
              title={copy.title}
              description={copy.description}
            />

            <ExploreTabs active={tab} tag={tag} />

            {tab === "for-you" && !session && (
              <div className="mt-8">
                <EmptyState
                  title="Sign in for your feed"
                  description="Follow authors and publications to build a personalized For You stream."
                  actionLabel="Sign in"
                  actionHref="/login?next=/explore?tab=for-you"
                />
              </div>
            )}

            {tab === "for-you" && session && forYouEmpty && (
              <div className="mt-8">
                <EmptyState
                  title="Your feed is empty"
                  description="Follow authors and publications to personalize For You — or explore trending while you build your network."
                  actionLabel="Browse publications"
                  actionHref="/publications"
                />
              </div>
            )}

            {tab === "following" && !session && (
              <div className="mt-8">
                <EmptyState
                  title="Sign in to see Following"
                  description="Your Following tab shows articles from people and publications you subscribe to."
                  actionLabel="Sign in"
                  actionHref="/login?next=/explore?tab=following"
                />
              </div>
            )}

            {showFeed && (
              <section className="mt-8" aria-label="Feed">
                {docs.length === 0 ? (
                  <EmptyState
                    title="No articles found"
                    description={
                      tab === "following"
                        ? "Follow authors and publications to see their latest work here."
                        : "Try another tab or topic, or check back as new content is published."
                    }
                    actionLabel="Browse publications"
                    actionHref="/publications"
                  />
                ) : (
                  <>
                    {showFeatured && <FeedDocumentCard doc={{ ...featured, signedIn: !!session }} variant="featured" />}
                    {feedDocs.map((doc) => (
                      <FeedDocumentCard key={doc.id} doc={{ ...doc, signedIn: !!session }} />
                    ))}
                  </>
                )}
              </section>
            )}

            {!session && tab !== "for-you" && tab !== "following" && (
              <p className="typo-body-sm text-muted-foreground mt-8">
                <Link href="/login?next=/explore" className="underline underline-offset-4">
                  Sign in
                </Link>{" "}
                to follow authors and personalize your feed.
              </p>
            )}
          </div>

          <ExploreSidebar
            tags={tagList}
            activeTag={tag}
            suggestedAuthors={suggestedAuthors}
            followingSet={followingSet}
            session={session}
            traces={repos}
          />
        </div>
      </div>
    </div>
  );
}
