import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatDistanceToNow } from "date-fns";
import { Users, FileText, PenLine } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { getMemberRole } from "@/services/publications";
import { canPublishArticle } from "@/lib/permissions/publication";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicationFollowButton } from "@/components/social/publication-follow-button";
import { formatCount, formatUsername } from "@/lib/utils";

type Props = { params: Promise<{ handle: string }> };

async function loadPublication(handle: string) {
  return prisma.publication.findUnique({
    where: { handle },
    include: {
      owner: { select: { id: true, username: true, name: true, image: true } },
      _count: { select: { followers: true, members: true } },
      members: {
        take: 8,
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, username: true, name: true, image: true } } },
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const pub = await loadPublication(handle);
  if (!pub) return { title: "Publication not found" };
  return {
    title: pub.name,
    description: pub.description || `${pub.name} on EVERYA`,
    openGraph: {
      title: pub.name,
      description: pub.description || undefined,
      images: pub.logo ? [{ url: pub.logo }] : undefined,
    },
  };
}

export default async function PublicationPage({ params }: Props) {
  const { handle } = await params;
  const publication = await loadPublication(handle);
  if (!publication) notFound();

  const session = await getServerSession();
  const memberRole = session ? await getMemberRole(publication.id, session.user.id) : null;
  const isMember = !!memberRole || publication.ownerId === session?.user.id;

  if (publication.visibility === "PRIVATE" && !isMember) notFound();

  const [articles, isFollowing, canWrite] = await Promise.all([
    prisma.document.findMany({
      where: {
        publicationId: publication.id,
        ...(isMember ? { status: { not: "ARCHIVED" } } : { status: "PUBLISHED" }),
      },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      take: 50,
      include: {
        author: { select: { username: true, name: true, image: true } },
      },
    }),
    session
      ? prisma.publicationFollow
          .findUnique({
            where: {
              publicationId_userId: { publicationId: publication.id, userId: session.user.id },
            },
          })
          .then((r) => !!r)
      : Promise.resolve(false),
    session && memberRole
      ? Promise.resolve(canPublishArticle(memberRole))
      : Promise.resolve(false),
  ]);

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
            {canWrite && (
              <Link href={`/p/${handle}/write`}>
                <Button size="sm" className="rounded-full">
                  <PenLine className="h-3.5 w-3.5" /> Write
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex items-start gap-5">
          <Avatar src={publication.logo} name={publication.name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-serif text-3xl tracking-tight">{publication.name}</h1>
                <p className="text-muted-foreground text-sm mt-1">@{publication.handle}</p>
              </div>
              <PublicationFollowButton handle={handle} initialFollowing={isFollowing} signedIn={!!session} />
            </div>
            {publication.description && (
              <p className="text-sm mt-4 max-w-2xl leading-relaxed text-muted-foreground">{publication.description}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {formatCount(publication._count.followers)} followers
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> {articles.length} articles
              </span>
              {publication.visibility === "PRIVATE" && <Badge variant="outline">Private</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              By{" "}
              <Link href={`/u/${publication.owner.username}`} className="hover:underline">
                {publication.owner.name || formatUsername(publication.owner.username)}
              </Link>
            </p>
          </div>
        </div>

        {publication.members.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
              Members · {publication._count.members}
            </h2>
            <div className="flex flex-wrap gap-3">
              {publication.members.map((m) => (
                <Link
                  key={m.user.id}
                  href={`/u/${m.user.username}`}
                  className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors"
                >
                  <Avatar src={m.user.image} name={m.user.name || m.user.username} size="sm" />
                  <span>{m.user.name || formatUsername(m.user.username)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Articles</h2>
          {articles.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No articles published yet.
              </CardContent>
            </Card>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/p/${handle}/${article.slug}`}
                  className="flex items-center justify-between px-4 py-3.5 text-sm hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <span className="font-medium block truncate">{article.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {article.author.name || formatUsername(article.author.username)}
                      {article.status !== "PUBLISHED" && ` · ${article.status}`}
                      {article.publishedAt &&
                        ` · ${formatDistanceToNow(article.publishedAt, { addSuffix: true })}`}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs shrink-0 ml-4">
                    {article.readingMinutes} min
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
