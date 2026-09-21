import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatDistanceToNow } from "date-fns";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getDocumentStats, recordDocumentView } from "@/services/documents";
import { getMemberRole } from "@/services/publications";
import { getServerSession } from "@/lib/session";
import { canViewArticle } from "@/lib/permissions/document";
import { canPublishArticle } from "@/lib/permissions/publication";
import { DocActions } from "@/components/docs/doc-actions";
import { DocStatsBar } from "@/components/docs/doc-stats-bar";
import { CommentSection } from "@/components/comments/comment-section";
import { ReadingProgress } from "@/components/docs/reading-progress";
import { ArticleReader } from "@/components/reader/article-reader";
import { ReaderBody } from "@/components/reader/reader-body";
import { StickyEngagementBar } from "@/components/reader/sticky-engagement-bar";
import { ShareButton } from "@/components/social/share-button";
import { TagPills } from "@/components/docs/tag-pills";
import { FollowButton } from "@/components/social/follow-button";
import { PublicationFollowButton } from "@/components/social/publication-follow-button";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { formatUsername } from "@/lib/utils";

type Props = { params: Promise<{ handle: string; slug: string }> };

async function loadArticle(handle: string, slug: string) {
  return prisma.document.findFirst({
    where: { slug, publication: { handle } },
    include: {
      author: { select: { id: true, username: true, name: true, image: true, bio: true } },
      publication: {
        select: {
          id: true,
          name: true,
          handle: true,
          logo: true,
          visibility: true,
          ownerId: true,
        },
      },
      repository: {
        select: { id: true, visibility: true, ownerId: true, slug: true, owner: { select: { username: true } } },
      },
      tags: { include: { tag: { select: { name: true, slug: true } } } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, slug } = await params;
  const document = await loadArticle(handle, slug);
  if (!document) return { title: "Article not found" };

  const description = document.excerpt || document.subtitle || undefined;
  return {
    title: document.title,
    description,
    openGraph: {
      title: document.title,
      description,
      type: "article",
      images: document.coverImage ? [{ url: document.coverImage }] : undefined,
    },
  };
}

export default async function PublicationArticlePage({ params }: Props) {
  const { handle, slug } = await params;
  const document = await loadArticle(handle, slug);
  if (!document || !document.publication) notFound();

  const session = await getServerSession();
  const memberRole =
    session && document.publicationId
      ? await getMemberRole(document.publicationId, session.user.id)
      : null;

  if (!canViewArticle(document, session?.user.id, memberRole)) notFound();
  if (
    document.publication.visibility === "PRIVATE" &&
    !memberRole &&
    document.authorId !== session?.user.id
  ) {
    notFound();
  }

  const isAuthor = session?.user.id === document.authorId;
  const canEdit =
    isAuthor ||
    (memberRole ? canPublishArticle(memberRole) : false);

  await recordDocumentView(document.id, session?.user.id);

  const [stats, comments, userLike, userBookmark, userRating, commentCount, isFollowingAuthor, isFollowingPub] =
    await Promise.all([
      getDocumentStats(document.id),
      prisma.comment.findMany({
        where: { documentId: document.id, parentId: null },
        include: {
          author: { select: { id: true, username: true, name: true, image: true } },
          replies: {
            include: { author: { select: { id: true, username: true, name: true, image: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      session
        ? prisma.documentLike.findUnique({
            where: { documentId_userId: { documentId: document.id, userId: session.user.id } },
          })
        : null,
      session
        ? prisma.bookmark.findUnique({
            where: { documentId_userId: { documentId: document.id, userId: session.user.id } },
          })
        : null,
      session
        ? prisma.rating.findUnique({
            where: { documentId_userId: { documentId: document.id, userId: session.user.id } },
          })
        : null,
      prisma.comment.count({ where: { documentId: document.id } }),
      session && session.user.id !== document.authorId
        ? prisma.userFollow
            .findUnique({
              where: {
                followerId_followingId: { followerId: session.user.id, followingId: document.authorId },
              },
            })
            .then((r) => !!r)
        : Promise.resolve(false),
      session
        ? prisma.publicationFollow
            .findUnique({
              where: {
                publicationId_userId: {
                  publicationId: document.publication!.id,
                  userId: session.user.id,
                },
              },
            })
            .then((r) => !!r)
        : Promise.resolve(false),
    ]);

  const serializedComments = comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    replies: c.replies.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), replies: [] })),
  }));
  const docTags = document.tags.map((t) => t.tag);
  const pub = document.publication;

  return (
    <>
      <ReadingProgress />
      <ArticleReader content={document.content}>
        <article data-article>
          {docTags.length > 0 && <TagPills tags={docTags} className="mb-6" />}

          <header data-doc-header>
            <Link
              href={`/p/${handle}`}
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2 mb-4"
            >
              <Avatar src={pub.logo} name={pub.name} size="sm" />
              {pub.name}
            </Link>

            <h1 className="font-serif text-[2.5rem] sm:text-[3.25rem] tracking-tight leading-[1.08]">
              {document.title}
            </h1>
            {document.subtitle && (
              <p className="mt-4 text-xl text-muted-foreground leading-relaxed">{document.subtitle}</p>
            )}

            <div className="mt-8 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Link href={`/u/${document.author.username}`}>
                  <Avatar
                    src={document.author.image}
                    name={document.author.name || document.author.username}
                    size="lg"
                  />
                </Link>
                <div>
                  <Link href={`/u/${document.author.username}`} className="font-medium hover:underline">
                    {document.author.name || formatUsername(document.author.username)}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(document.updatedAt, { addSuffix: true })} · {document.readingMinutes} min read
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <FollowButton
                  username={document.author.username}
                  initialFollowing={isFollowingAuthor}
                  signedIn={!!session}
                  isSelf={isAuthor}
                />
                <PublicationFollowButton
                  handle={handle}
                  initialFollowing={isFollowingPub}
                  signedIn={!!session}
                />
              </div>
            </div>

            <div className="mt-8">
              <DocStatsBar stats={stats} commentCount={commentCount} />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 pb-8 border-b border-border">
              <DocActions
                documentId={document.id}
                initialLiked={!!userLike}
                initialBookmarked={!!userBookmark}
                initialRating={userRating?.value}
                likeCount={stats.likeCount}
                signedIn={!!session}
              />
              <ShareButton />
              {canEdit && (
                <Link href={`/p/${handle}/write?id=${document.id}`}>
                  <Button variant="outline" size="sm" className="rounded-full">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                </Link>
              )}
            </div>
          </header>

          <div className="py-10">
            <ReaderBody content={document.content} />
          </div>

          <aside className="my-12 rounded-2xl stat-card p-6 flex gap-5">
            <Avatar src={document.author.image} name={document.author.name || document.author.username} size="lg" />
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">About the author</p>
              <Link
                href={`/u/${document.author.username}`}
                className="text-lg font-medium hover:underline mt-1 inline-block"
              >
                {document.author.name || formatUsername(document.author.username)}
              </Link>
              {document.author.bio && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{document.author.bio}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <FollowButton
                  username={document.author.username}
                  initialFollowing={isFollowingAuthor}
                  signedIn={!!session}
                  isSelf={isAuthor}
                />
                <PublicationFollowButton
                  handle={handle}
                  initialFollowing={isFollowingPub}
                  signedIn={!!session}
                />
              </div>
            </div>
          </aside>

          <section className="border-t border-border pt-10">
            <h2 className="font-serif text-2xl mb-6">{commentCount} Responses</h2>
            <CommentSection
              documentId={document.id}
              initialComments={serializedComments}
              currentUserId={session?.user.id}
            />
          </section>
        </article>
      </ArticleReader>

      <StickyEngagementBar
        title={document.title}
        documentId={document.id}
        initialLiked={!!userLike}
        initialBookmarked={!!userBookmark}
        initialRating={userRating?.value}
        likeCount={stats.likeCount}
        signedIn={!!session}
      />
    </>
  );
}
