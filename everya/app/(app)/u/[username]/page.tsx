import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, FileText, BookOpen, Globe, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TabsNav } from "@/components/ui/tabs";
import { EmptyState } from "@/components/everya/empty-state";
import { FollowButton } from "@/components/social/follow-button";
import { FeedDocumentCard } from "@/components/feed/feed-document-card";
import { formatUsername, formatCount } from "@/lib/utils";

const tabs = [
  { id: "articles", label: "Articles" },
  { id: "publications", label: "Publications" },
  { id: "about", label: "About" },
] as const;

type Tab = (typeof tabs)[number]["id"];

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { username: raw } = await params;
  const username = raw.replace(/^@/, "");
  const { tab: rawTab } = await searchParams;
  const tab = (tabs.some((t) => t.id === rawTab) ? rawTab : "articles") as Tab;
  const session = await getServerSession();

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      bio: true,
      website: true,
      createdAt: true,
    },
  });

  if (!user) notFound();
  const isOwner = session?.user.id === user.id;

  const [articles, ownedPublications, memberPublications, followerCount, followingCount, isFollowing] =
    await Promise.all([
      prisma.document.findMany({
        where: {
          authorId: user.id,
          ...(isOwner ? { status: { not: "ARCHIVED" } } : { status: "PUBLISHED" }),
        },
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        take: 50,
        include: {
          publication: { select: { handle: true, name: true, logo: true } },
          repository: { select: { slug: true, name: true, visibility: true, owner: { select: { username: true } } } },
          tags: { include: { tag: { select: { name: true, slug: true } } } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.publication.findMany({
        where: {
          ownerId: user.id,
          ...(isOwner ? {} : { visibility: "PUBLIC" }),
        },
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { followers: true, articles: true } } },
      }),
      prisma.publicationMember.findMany({
        where: {
          userId: user.id,
          publication: {
            ownerId: { not: user.id },
            visibility: "PUBLIC",
          },
        },
        include: {
          publication: {
            include: { _count: { select: { followers: true, articles: true } } },
          },
        },
      }),
      prisma.userFollow.count({ where: { followingId: user.id } }),
      prisma.userFollow.count({ where: { followerId: user.id } }),
      session && !isOwner
        ? prisma.userFollow
            .findUnique({
              where: { followerId_followingId: { followerId: session.user.id, followingId: user.id } },
            })
            .then((r) => !!r)
        : Promise.resolve(false),
    ]);

  const visibleArticles = articles.filter(
    (d) => isOwner || d.publicationId || d.repository.visibility === "PUBLIC"
  );
  const publications = [
    ...ownedPublications.map((p) => ({ ...p, role: "Owner" as const })),
    ...memberPublications.map((m) => ({ ...m.publication, role: m.role })),
  ];
  const totalReaders = visibleArticles.reduce((s, d) => s + d.readerCount, 0);

  return (
    <div className="min-h-full bg-background">
      <div className="page-container py-page max-w-4xl">
        <div className="flex items-start gap-6">
          <Avatar src={user.image} name={user.name || user.username} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="typo-page-title">{user.name || formatUsername(user.username)}</h1>
                <p className="typo-meta mt-1">{formatUsername(user.username)}</p>
              </div>
              <FollowButton
                username={user.username}
                initialFollowing={isFollowing}
                signedIn={!!session}
                isSelf={isOwner}
              />
            </div>
            {user.bio && tab !== "about" && (
              <p className="typo-body-sm mt-3 max-w-lg text-muted-foreground line-clamp-2">{user.bio}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-4 typo-meta">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" aria-hidden="true" /> {formatCount(followerCount)} followers · {followingCount} following
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> {publications.length} publications
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" /> {visibleArticles.length} articles
              </span>
              <span>{formatCount(totalReaders)} readers</span>
            </div>
          </div>
        </div>

        <TabsNav
          className="mt-10"
          ariaLabel="Profile sections"
          activeId={tab}
          items={tabs.map((t) => ({
            id: t.id,
            label: t.label,
            href: `/u/${username}?tab=${t.id}`,
          }))}
        />

        {tab === "articles" && (
          <section className="mt-8">
            {visibleArticles.length === 0 ? (
              <EmptyState
                title="No articles yet"
                description={isOwner ? "Publish your first article from a publication." : "This author has not published articles yet."}
                actionLabel={isOwner ? "Create" : undefined}
                actionHref={isOwner ? "/create" : undefined}
              />
            ) : (
              <div>
                {visibleArticles.map((doc) => (
                  <FeedDocumentCard
                    key={doc.id}
                    doc={{
                      ...doc,
                      author: { username: user.username, name: user.name, image: user.image },
                      excerpt: doc.excerpt,
                      readerCount: doc.readerCount,
                      ratings: [],
                    }}
                    variant="compact"
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "publications" && (
          <section className="mt-8">
            {publications.length === 0 ? (
              <EmptyState
                title="No publications yet"
                description={isOwner ? "Start a publication to publish articles." : "This author has no public publications."}
                actionLabel={isOwner ? "New publication" : undefined}
                actionHref={isOwner ? "/publications/new" : undefined}
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {publications.map((pub) => (
                  <Link
                    key={pub.id}
                    href={`/p/${pub.handle}`}
                    className="surface-bordered p-4 hover:bg-muted/30 motion-fast"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="typo-nav">{pub.name}</span>
                      <Badge variant="outline">{pub.role}</Badge>
                    </div>
                    <p className="typo-meta">
                      {pub._count.articles} articles · {formatCount(pub._count.followers)} followers
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "about" && (
          <section className="mt-8 space-y-6">
            {user.bio ? (
              <div>
                <h2 className="typo-caption mb-2">Bio</h2>
                <p className="typo-body-sm text-muted-foreground max-w-lg">{user.bio}</p>
              </div>
            ) : (
              <p className="typo-body-sm text-muted-foreground">No bio yet.</p>
            )}
            {user.website && (
              <div>
                <h2 className="typo-caption mb-2">Website</h2>
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 typo-body-sm hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                  {user.website.replace(/^https?:\/\//, "")}
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              </div>
            )}
            <div>
              <h2 className="typo-caption mb-2">Member since</h2>
              <p className="typo-body-sm text-muted-foreground">
                {user.createdAt.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
