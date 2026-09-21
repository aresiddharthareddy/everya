import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTraceTree, traceHref, assertCanViewTrace } from "@/services/traces";
import { getDocumentStats, recordDocumentView } from "@/services/documents";
import { getServerSession } from "@/lib/session";
import { CommentSection } from "@/components/comments/comment-section";
import { RepoTree } from "@/components/repos/repo-tree";
import { ReadingProgress } from "@/components/docs/reading-progress";
import { ArticleReader } from "@/components/reader/article-reader";
import { ReaderBody } from "@/components/reader/reader-body";
import { ReaderArticleHeader } from "@/components/reader/reader-article-header";
import { ReaderAuthorCard } from "@/components/reader/reader-author-card";
import { StickyEngagementBar } from "@/components/reader/sticky-engagement-bar";
import { KnowledgeNav } from "@/components/navigation/knowledge-nav";
import { formatUsername } from "@/lib/utils";

export default async function TraceDocumentPage({
  params,
}: {
  params: Promise<{ username: string; slug: string; doc: string }>;
}) {
  const { username, slug: traceSlug, doc: docSlug } = await params;

  const document = await prisma.document.findFirst({
    where: {
      slug: docSlug,
      publicationId: null,
      repository: { slug: traceSlug, owner: { username: username.replace(/^@/, "") }, publication: null },
    },
    include: {
      author: { select: { id: true, username: true, name: true, image: true, bio: true } },
      repository: {
        select: {
          id: true,
          name: true,
          slug: true,
          visibility: true,
          ownerId: true,
          owner: { select: { username: true } },
        },
      },
      tags: { include: { tag: { select: { name: true, slug: true } } } },
    },
  });

  const session = await getServerSession();
  if (!document || !assertCanViewTrace(document.repository, session?.user.id)) notFound();

  const isAuthor = session?.user.id === document.authorId;
  await recordDocumentView(document.id, session?.user.id);

  const [stats, tree, comments, userLike, userBookmark, userRating, commentCount, isFollowing] = await Promise.all([
    getDocumentStats(document.id),
    getTraceTree(document.repositoryId),
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
  ]);

  const basePath = traceHref(document.repository);
  const serializedComments = comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    replies: c.replies.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), replies: [] })),
  }));

  return (
    <>
      <ReadingProgress />
      <ArticleReader
        content={document.content}
        tree={<RepoTree tree={tree} basePath={basePath} activeSlug={docSlug} />}
      >
        <article data-article>
          <KnowledgeNav
            items={[
              { label: formatUsername(document.repository.owner.username), href: `/u/${document.repository.owner.username}` },
              { label: document.repository.name, href: basePath },
              { label: document.title },
            ]}
          />
          <ReaderArticleHeader
            title={document.title}
            subtitle={document.subtitle}
            coverImage={document.coverImage}
            updatedAt={document.updatedAt}
            readingMinutes={document.readingMinutes}
            contentType="document"
            trace={{
              name: document.repository.name,
              slug: document.repository.slug,
              ownerUsername: document.repository.owner.username,
            }}
            author={document.author}
            tags={document.tags.map((t) => t.tag)}
            stats={stats}
            commentCount={commentCount}
            documentId={document.id}
            engagement={{ liked: !!userLike, bookmarked: !!userBookmark, rating: userRating?.value, signedIn: !!session }}
            follow={{ authorFollowing: isFollowing, isAuthor }}
            editHref={isAuthor ? `${basePath}/${docSlug}/edit` : undefined}
          />
          <ReaderBody content={document.content} />
          <ReaderAuthorCard author={document.author} signedIn={!!session} isFollowing={isFollowing} isSelf={isAuthor} />
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
