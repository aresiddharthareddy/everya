import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getDocumentStats, recordDocumentView } from "@/services/documents";
import { getMemberRole } from "@/services/publications";
import { getServerSession } from "@/lib/session";
import { canViewArticle } from "@/lib/permissions/document";
import { canPublishArticle } from "@/lib/permissions/publication";
import { CommentSection } from "@/components/comments/comment-section";
import { ReadingProgress } from "@/components/docs/reading-progress";
import { ArticleReader } from "@/components/reader/article-reader";
import { ReaderBody } from "@/components/reader/reader-body";
import { ReaderArticleHeader } from "@/components/reader/reader-article-header";
import { ReaderAuthorCard } from "@/components/reader/reader-author-card";
import { StickyEngagementBar } from "@/components/reader/sticky-engagement-bar";

type Props = { params: Promise<{ handle: string; slug: string }> };

async function loadArticle(handle: string, slug: string) {
  return prisma.document.findFirst({
    where: { slug, publication: { handle } },
    include: {
      author: { select: { id: true, username: true, name: true, image: true, bio: true } },
      publication: {
        select: { id: true, name: true, handle: true, logo: true, visibility: true, ownerId: true },
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
    openGraph: { title: document.title, description, type: "article", images: document.coverImage ? [{ url: document.coverImage }] : undefined },
  };
}

export default async function PublicationArticlePage({ params }: Props) {
  const { handle, slug } = await params;
  const document = await loadArticle(handle, slug);
  if (!document || !document.publication) notFound();

  const session = await getServerSession();
  const memberRole = session && document.publicationId ? await getMemberRole(document.publicationId, session.user.id) : null;

  if (!canViewArticle(document, session?.user.id, memberRole)) notFound();
  if (document.publication.visibility === "PRIVATE" && !memberRole && document.authorId !== session?.user.id) notFound();

  const isAuthor = session?.user.id === document.authorId;
  const canEdit = isAuthor || (memberRole ? canPublishArticle(memberRole) : false);

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
      session ? prisma.documentLike.findUnique({ where: { documentId_userId: { documentId: document.id, userId: session.user.id } } }) : null,
      session ? prisma.bookmark.findUnique({ where: { documentId_userId: { documentId: document.id, userId: session.user.id } } }) : null,
      session ? prisma.rating.findUnique({ where: { documentId_userId: { documentId: document.id, userId: session.user.id } } }) : null,
      prisma.comment.count({ where: { documentId: document.id } }),
      session && session.user.id !== document.authorId
        ? prisma.userFollow.findUnique({ where: { followerId_followingId: { followerId: session.user.id, followingId: document.authorId } } }).then((r) => !!r)
        : Promise.resolve(false),
      session
        ? prisma.publicationFollow.findUnique({ where: { publicationId_userId: { publicationId: document.publication!.id, userId: session.user.id } } }).then((r) => !!r)
        : Promise.resolve(false),
    ]);

  const serializedComments = comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    replies: c.replies.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), replies: [] })),
  }));
  const pub = document.publication;

  return (
    <>
      <ReadingProgress />
      <ArticleReader content={document.content}>
        <article data-article>
          <ReaderArticleHeader
            title={document.title}
            subtitle={document.subtitle}
            coverImage={document.coverImage}
            updatedAt={document.updatedAt}
            readingMinutes={document.readingMinutes}
            contentType="article"
            publication={{ name: pub.name, handle: pub.handle }}
            author={document.author}
            tags={document.tags.map((t) => t.tag)}
            stats={stats}
            commentCount={commentCount}
            documentId={document.id}
            engagement={{ liked: !!userLike, bookmarked: !!userBookmark, rating: userRating?.value, signedIn: !!session }}
            follow={{ authorFollowing: isFollowingAuthor, isAuthor, publicationHandle: handle, publicationFollowing: isFollowingPub }}
            editHref={canEdit ? `/p/${handle}/write?id=${document.id}` : undefined}
          />
          <ReaderBody content={document.content} />
          <ReaderAuthorCard
            author={document.author}
            signedIn={!!session}
            isFollowing={isFollowingAuthor}
            isSelf={isAuthor}
            publicationHandle={handle}
            publicationFollowing={isFollowingPub}
          />
          <CommentSection documentId={document.id} initialComments={serializedComments} currentUserId={session?.user.id} />
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
