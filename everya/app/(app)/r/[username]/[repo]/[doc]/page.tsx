import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getRepositoryTree } from "@/services/repositories";
import { getDocumentStats, recordDocumentView } from "@/services/documents";
import { getServerSession } from "@/lib/session";
import { canViewRepo } from "@/lib/access";
import { DocActions } from "@/components/docs/doc-actions";
import { DocStatsBar } from "@/components/docs/doc-stats-bar";
import { CommentSection } from "@/components/comments/comment-section";
import { RepoTree } from "@/components/repos/repo-tree";
import { ReadingProgress } from "@/components/docs/reading-progress";
import { ArticleReader } from "@/components/reader/article-reader";
import { ReaderBody } from "@/components/reader/reader-body";
import { StickyEngagementBar } from "@/components/reader/sticky-engagement-bar";
import { ShareButton } from "@/components/social/share-button";
import { TagPills } from "@/components/docs/tag-pills";
import { FollowButton } from "@/components/social/follow-button";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { formatUsername } from "@/lib/utils";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ username: string; repo: string; doc: string }>;
}) {
  const { username, repo: repoSlug, doc: docSlug } = await params;

  const document = await prisma.document.findFirst({
    where: {
      slug: docSlug,
      repository: {
        slug: repoSlug,
        owner: { username: username.replace(/^@/, "") },
      },
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

  if (!document) notFound();

  const session = await getServerSession();
  if (!canViewRepo(document.repository, session?.user.id)) notFound();

  const isAuthor = session?.user.id === document.authorId;
  await recordDocumentView(document.id, session?.user.id);

  const [stats, tree, comments, userLike, userBookmark, userRating, commentCount, isFollowing] =
    await Promise.all([
      getDocumentStats(document.id),
      getRepositoryTree(document.repositoryId),
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
    ]);

  const basePath = `/r/${document.repository.owner.username}/${document.repository.slug}`;
  const serializedComments = comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    replies: c.replies.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), replies: [] })),
  }));
  const docTags = document.tags.map((t) => t.tag);

  return (
    <>
      <ReadingProgress />
      <ArticleReader
        content={document.content}
        tree={<RepoTree tree={tree} basePath={basePath} activeSlug={docSlug} />}
      >
        <article data-article>
          {docTags.length > 0 && <TagPills tags={docTags} className="mb-6" />}

          <header data-doc-header>
            <h1 className="font-serif text-[2.5rem] sm:text-[3.25rem] tracking-tight leading-[1.08]">
              {document.title}
            </h1>

            <div className="mt-8 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Link href={`/u/${document.author.username}`}>
                  <Avatar src={document.author.image} name={document.author.name || document.author.username} size="lg" />
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
              <FollowButton
                username={document.author.username}
                initialFollowing={isFollowing}
                signedIn={!!session}
                isSelf={isAuthor}
              />
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
              {isAuthor && (
                <>
                  <Link href="/stats">
                    <Button variant="outline" size="sm" className="rounded-full">View stats</Button>
                  </Link>
                  <Link href={`${basePath}/${docSlug}/edit`}>
                    <Button variant="outline" size="sm" className="rounded-full">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                  </Link>
                </>
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
              <Link href={`/u/${document.author.username}`} className="text-lg font-medium hover:underline mt-1 inline-block">
                {document.author.name || formatUsername(document.author.username)}
              </Link>
              {document.author.bio && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{document.author.bio}</p>
              )}
              <div className="mt-4">
                <FollowButton
                  username={document.author.username}
                  initialFollowing={isFollowing}
                  signedIn={!!session}
                  isSelf={isAuthor}
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
