import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PenLine } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { getMemberRole } from "@/services/publications";
import { canPublishArticle } from "@/lib/permissions/publication";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/navigation/page-header";
import { PublicationIdentity } from "@/components/content/publication-identity";
import { AuthorIdentity } from "@/components/content/author-identity";
import { ContentMeta } from "@/components/content/content-meta";
import { FeedDocumentCard } from "@/components/feed/feed-document-card";
import { EmptyState } from "@/components/everya/empty-state";
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
    openGraph: { title: pub.name, description: pub.description || undefined, images: pub.logo ? [{ url: pub.logo }] : undefined },
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
        publication: { select: { handle: true, name: true, logo: true } },
        repository: { select: { slug: true, name: true, owner: { select: { username: true } } } },
        tags: { include: { tag: { select: { name: true, slug: true } } } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    session
      ? prisma.publicationFollow.findUnique({ where: { publicationId_userId: { publicationId: publication.id, userId: session.user.id } } }).then((r) => !!r)
      : Promise.resolve(false),
    session && memberRole ? Promise.resolve(canPublishArticle(memberRole)) : Promise.resolve(false),
  ]);

  const [featured, ...rest] = articles;

  return (
    <div className="min-h-full bg-background">
      <div className="page-container py-page max-w-4xl">
        <PageHeader
          eyebrow="Publication"
          title={publication.name}
          description={publication.description || `Articles and updates from @${publication.handle}.`}
          actions={
            <div className="flex items-center gap-2">
              <PublicationFollowButton handle={handle} initialFollowing={isFollowing} signedIn={!!session} />
              {canWrite && (
                <Link href={`/p/${handle}/write`}>
                  <Button size="sm">
                    <PenLine className="h-3.5 w-3.5" /> Write article
                  </Button>
                </Link>
              )}
            </div>
          }
        />

        <div className="mt-8 flex items-start gap-5">
          <PublicationIdentity name={publication.name} handle={publication.handle} description={publication.description} />
        </div>

        <ContentMeta
          className="mt-4"
          items={[
            `${formatCount(publication._count.followers)} followers`,
            `${articles.length} articles`,
            publication.visibility === "PRIVATE" ? "Private" : "Public",
          ]}
        />

        <div className="mt-4">
          <AuthorIdentity
            size="sm"
            name={publication.owner.name}
            username={publication.owner.username}
            image={publication.owner.image}
            href={`/u/${publication.owner.username}`}
            meta="Owner"
          />
        </div>

        {publication.members.length > 0 && (
          <section className="mt-10">
            <h2 className="typo-caption mb-4">Members · {publication._count.members}</h2>
            <div className="flex flex-wrap gap-2">
              {publication.members.map((m) => (
                <Link
                  key={m.user.id}
                  href={`/u/${m.user.username}`}
                  className="inline-flex items-center gap-2 surface-bordered px-3 py-2 motion-fast hover:bg-muted/40 min-h-[44px]"
                >
                  <Avatar src={m.user.image} name={m.user.name || m.user.username} size="sm" />
                  <span className="typo-body-sm">{m.user.name || formatUsername(m.user.username)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12">
          <h2 className="typo-section-title mb-6">Articles</h2>
          {articles.length === 0 ? (
            <EmptyState
              title="No articles yet"
              description={canWrite ? "Write the first article for this publication." : "Check back soon for new articles."}
              actionLabel={canWrite ? "Write article" : undefined}
              actionHref={canWrite ? `/p/${handle}/write` : undefined}
            />
          ) : (
            <div>
              {featured && (
                <FeedDocumentCard
                  doc={{
                    ...featured,
                    excerpt: featured.excerpt,
                    readerCount: featured.readerCount,
                    ratings: [],
                  }}
                  variant="featured"
                />
              )}
              {rest.map((article) => (
                <FeedDocumentCard
                  key={article.id}
                  doc={{ ...article, excerpt: article.excerpt, readerCount: article.readerCount, ratings: [] }}
                  variant="compact"
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
