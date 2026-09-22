import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { documentPageMetadata } from "@/lib/page-metadata";
import { documentSharePath } from "@/lib/share-url";
import { HashScroll } from "@/components/navigation/hash-scroll";
import { getTraceTree, traceHref, assertCanViewTrace } from "@/services/traces";
import { getDocumentKnowledge } from "@/services/knowledge";
import { DocumentKnowledgePanel } from "@/components/knowledge/document-knowledge-panel";
import { DocumentContributors } from "@/components/knowledge/document-contributors";
import { getDocumentContributors } from "@/services/collaboration";
import { DocumentNavFooter } from "@/components/reader/document-nav-footer";
import { resolveDocNav } from "@/lib/document-nav";
import { canEditTraceContent, getTraceRole } from "@/lib/permissions/trace";
import { getDocumentStats, recordDocumentView } from "@/services/documents";
import { getServerSession } from "@/lib/session";
import { CommentSection } from "@/components/comments/comment-section";
import { KnowledgeTree } from "@/components/knowledge/knowledge-tree";
import { ReadingProgress } from "@/components/docs/reading-progress";
import { ArticleReader } from "@/components/reader/article-reader";
import { ReaderBody } from "@/components/reader/reader-body";
import { ReaderArticleHeader } from "@/components/reader/reader-article-header";
import { ReaderAuthorCard } from "@/components/reader/reader-author-card";
import { StickyEngagementBar } from "@/components/reader/sticky-engagement-bar";
import { KnowledgeNav } from "@/components/navigation/knowledge-nav";
import { formatUsername } from "@/lib/utils";
import { checkContentEntitlement } from "@/services/entitlements";
import { PremiumPaywall } from "@/components/creator/premium-paywall";
import { AccessBadge } from "@/components/creator/access-badge";

async function loadTraceDocument(username: string, traceSlug: string, docSlug: string) {
  return prisma.document.findFirst({
    where: {
      slug: docSlug,
      publicationId: null,
      repository: { slug: traceSlug, owner: { username: username.replace(/^@/, "") }, publication: null },
    },
    include: {
      author: { select: { id: true, username: true, name: true, image: true, bio: true } },
      lastEditedBy: { select: { username: true, name: true } },
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
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; slug: string; doc: string }>;
}): Promise<Metadata> {
  const { username, slug, doc } = await params;
  const document = await loadTraceDocument(username, slug, doc);
  if (!document) return { title: "Document not found" };
  const path = documentSharePath({
    slug: document.slug,
    publicationId: document.publicationId,
    repository: document.repository,
  });
  return documentPageMetadata(document, path);
}

export default async function TraceDocumentPage({
  params,
}: {
  params: Promise<{ username: string; slug: string; doc: string }>;
}) {
  const { username, slug: traceSlug, doc: docSlug } = await params;

  const document = await loadTraceDocument(username, traceSlug, docSlug);

  const session = await getServerSession();
  if (!document || !(await assertCanViewTrace(document.repository, session?.user.id))) notFound();

  const traceRole = session ? await getTraceRole(document.repositoryId, session.user.id) : null;
  if (document.status === "DRAFT" && (!traceRole || !canEditTraceContent(traceRole))) notFound();
  const canEdit = traceRole ? canEditTraceContent(traceRole) : false;
  const isAuthor = session?.user.id === document.authorId;
  const entitlement = await checkContentEntitlement(document, session?.user.id, {
    traceEditor: canEdit,
  });
  const canReadContent = entitlement.allowed;
  if (canReadContent) await recordDocumentView(document.id, session?.user.id);

  const [stats, tree, comments, userLike, userBookmark, userRating, commentCount, isFollowing, knowledge, contributors] = await Promise.all([
    getDocumentStats(document.id),
    getTraceTree(document.repositoryId, { includeDrafts: canEdit }),
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
    getDocumentKnowledge(document.id, session?.user.id),
    getDocumentContributors(document.id),
  ]);

  const basePath = traceHref(document.repository);
  const shareUrl = documentSharePath({
    slug: document.slug,
    publicationId: document.publicationId,
    repository: document.repository,
  });
  const navLinks = knowledge
    ? [...knowledge.outbound, ...knowledge.inbound].map((l) => ({
        type: l.type,
        href: l.href,
        document: { title: l.document.title },
      }))
    : [];
  const docNav = resolveDocNav(navLinks, tree, basePath, docSlug);
  const serializedComments = comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    replies: c.replies.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), replies: [] })),
  }));

  return (
    <>
      <HashScroll />
      <ReadingProgress />
      <ArticleReader
        content={canReadContent ? document.content : ""}
        tree={<KnowledgeTree tree={tree} basePath={basePath} activeSlug={docSlug} />}
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
            lastEditor={document.lastEditedBy}
            tags={document.tags.map((t) => t.tag)}
            badge={<AccessBadge level={document.accessLevel} />}
            stats={stats}
            commentCount={commentCount}
            documentId={document.id}
            engagement={{ liked: !!userLike, bookmarked: !!userBookmark, rating: userRating?.value, signedIn: !!session }}
            follow={{ authorFollowing: isFollowing, isAuthor }}
            editHref={canEdit ? `${basePath}/${docSlug}/edit` : undefined}
            shareUrl={shareUrl}
          />
          {canReadContent ? (
            <ReaderBody content={document.content} />
          ) : (
            <PremiumPaywall
              accessLevel={document.accessLevel}
              creatorUsername={document.repository.owner.username}
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
          {contributors && <DocumentContributors contributors={contributors.contributors} />}
          <DocumentNavFooter
            previous={docNav.previous}
            next={docNav.next}
            traceHref={docNav.traceHref}
            traceName={document.repository.name}
          />
          <ReaderAuthorCard author={document.author} signedIn={!!session} isFollowing={isFollowing} isSelf={isAuthor} />
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
