import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getDocumentStats, recordDocumentView } from "@/services/documents";
import { getMemberRole } from "@/services/publications";
import { getServerSession } from "@/lib/session";
import { canViewArticle } from "@/lib/permissions/document";
import { canPublishArticle, roleAtLeast } from "@/lib/permissions/publication";
import { checkContentEntitlement } from "@/services/entitlements";
import { PremiumPaywall } from "@/components/creator/premium-paywall";
import { AccessBadge } from "@/components/creator/access-badge";
import { CommentSection } from "@/components/comments/comment-section";
import { HashScroll } from "@/components/navigation/hash-scroll";
import { documentPageMetadata } from "@/lib/page-metadata";
import { documentSharePath } from "@/lib/share-url";
import { ReadingProgress } from "@/components/docs/reading-progress";
import { ArticleReader } from "@/components/reader/article-reader";
import { ReaderBody } from "@/components/reader/reader-body";
import { ReaderArticleHeader } from "@/components/reader/reader-article-header";
import { ReaderAuthorCard } from "@/components/reader/reader-author-card";
import { StickyEngagementBar } from "@/components/reader/sticky-engagement-bar";
import { getDocumentKnowledge } from "@/services/knowledge";
import { DocumentKnowledgePanel } from "@/components/knowledge/document-knowledge-panel";

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
  const path = documentSharePath({
    slug: document.slug,
    publicationId: document.publicationId,
    publication: document.publication,
    repository: document.repository,
  });
  return documentPageMetadata(document, path);
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
  const entitlement = await checkContentEntitlement(document, session?.user.id, {
    publicationRole: memberRole ? roleAtLeast(memberRole, "CONTRIBUTOR") : false,
  });
  const canReadContent = entitlement.allowed;
  if (canReadContent) await recordDocumentView(document.id, session?.user.id);

  const [stats, comments, userLike, userBookmark, userRating, commentCount, isFollowingAuthor, isFollowingPub, knowledge] =
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
      canReadContent ? getDocumentKnowledge(document.id, session?.user.id) : Promise.resolve(null),
    ]);

  const serializedComments = comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    replies: c.replies.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), replies: [] })),
  }));
  const pub = document.publication;
  const shareUrl = documentSharePath({
    slug: document.slug,
    publicationId: document.publicationId,
    publication: document.publication,
    repository: document.repository,
  });

  return (
    <>
      <HashScroll />
      <ReadingProgress />
      <ArticleReader content={canReadContent ? document.content : ""}>
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
            badge={<AccessBadge level={document.accessLevel} />}
            stats={stats}
            commentCount={commentCount}
            documentId={document.id}
            engagement={{ liked: !!userLike, bookmarked: !!userBookmark, rating: userRating?.value, signedIn: !!session }}
            follow={{ authorFollowing: isFollowingAuthor, isAuthor, publicationHandle: handle, publicationFollowing: isFollowingPub }}
            editHref={canEdit ? `/p/${handle}/write?id=${document.id}` : undefined}
            shareUrl={shareUrl}
          />
          {canReadContent ? (
            <ReaderBody content={document.content} />
          ) : (
            <PremiumPaywall
              accessLevel={document.accessLevel}
              creatorUsername={document.author.username}
              signedIn={!!session}
            />
          )}
          {knowledge && (
            <DocumentKnowledgePanel
              trace={knowledge.trace}
              publication={knowledge.publication}
              outbound={knowledge.outbound}
              inbound={knowledge.inbound}
              references={knowledge.references}
              referencedBy={knowledge.referencedBy}
              dependencies={knowledge.dependencies}
              partOf={knowledge.partOf}
              previous={knowledge.previous}
              next={knowledge.next}
              sameTrace={knowledge.sameTrace}
              sharedTags={knowledge.sharedTags}
            />
          )}
          <ReaderAuthorCard
            author={document.author}
            signedIn={!!session}
            isFollowing={isFollowingAuthor}
            isSelf={isAuthor}
            publicationHandle={handle}
            publicationFollowing={isFollowingPub}
          />
          <CommentSection
            documentId={document.id}
            initialComments={serializedComments}
            currentUserId={session?.user.id}
            canModerate={canEdit || isAuthor}
          />
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
        shareUrl={shareUrl}
      />
    </>
  );
}
