import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, FileText, BookOpen, Globe, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { articleHref } from "@/services/feed";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FollowButton } from "@/components/social/follow-button";
import { formatUsername, formatCount } from "@/lib/utils";
import { cn } from "@/lib/utils";

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
          publication: { select: { handle: true, name: true } },
          repository: { select: { slug: true, visibility: true, owner: { select: { username: true } } } },
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="mx-auto max-w-4xl px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold text-xs tracking-[0.16em]">
            EVERYA
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground">
              Explore
            </Link>
            {session && (
              <Link href="/reading-list" className="text-sm text-muted-foreground hover:text-foreground">
                Reading list
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex items-start gap-6">
          <Avatar src={user.image} name={user.name || user.username} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-serif text-3xl tracking-tight">{user.name || formatUsername(user.username)}</h1>
                <p className="text-muted-foreground">{formatUsername(user.username)}</p>
              </div>
              <FollowButton
                username={user.username}
                initialFollowing={isFollowing}
                signedIn={!!session}
                isSelf={isOwner}
              />
            </div>
            {user.bio && tab !== "about" && (
              <p className="text-sm mt-3 max-w-lg leading-relaxed text-muted-foreground line-clamp-2">{user.bio}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {formatCount(followerCount)} followers · {followingCount} following
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" /> {publications.length} publications
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> {visibleArticles.length} articles
              </span>
              <span>{formatCount(totalReaders)} readers</span>
            </div>
          </div>
        </div>

        <nav className="flex gap-1 border-b border-border mt-10">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={`/u/${username}?tab=${t.id}`}
              className={cn(
                "px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px",
                tab === t.id
                  ? "border-foreground text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {tab === "articles" && (
          <section className="mt-8">
            {visibleArticles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No published articles yet.</p>
            ) : (
              <div className="divide-y divide-border rounded-xl border border-border">
                {visibleArticles.map((doc) => (
                  <Link
                    key={doc.id}
                    href={articleHref(doc)}
                    className="flex items-center justify-between px-4 py-3.5 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <span className="font-medium block truncate">{doc.title}</span>
                      {doc.publication && (
                        <span className="text-xs text-muted-foreground">{doc.publication.name}</span>
                      )}
                    </div>
                    <span className="text-muted-foreground text-xs shrink-0 ml-4">
                      {formatCount(doc.readerCount)} readers
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "publications" && (
          <section className="mt-8">
            {publications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No publications yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {publications.map((pub) => (
                  <Link
                    key={pub.id}
                    href={`/p/${pub.handle}`}
                    className="rounded-xl border border-border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{pub.name}</span>
                      <Badge variant="outline">{pub.role}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
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
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Bio</h2>
                <p className="text-sm leading-relaxed text-muted-foreground max-w-lg">{user.bio}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No bio yet.</p>
            )}
            {user.website && (
              <div>
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Website</h2>
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-foreground hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {user.website.replace(/^https?:\/\//, "")}
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              </div>
            )}
            <div>
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Member since</h2>
              <p className="text-sm text-muted-foreground">
                {user.createdAt.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
