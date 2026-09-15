import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getRepositoryTree } from "@/services/repositories";
import { getDocumentStats, recordDocumentView } from "@/services/documents";
import { getServerSession } from "@/lib/session";
import { canViewRepo } from "@/lib/access";
import { MarkdownRenderer } from "@/components/docs/markdown-renderer";
import { DocStatsHeader } from "@/components/docs/doc-stats-header";
import { DocActions } from "@/components/docs/doc-actions";
import { CommentSection } from "@/components/comments/comment-section";
import { RepoTree } from "@/components/repos/repo-tree";
import { Breadcrumbs } from "@/components/repos/breadcrumbs";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { ReadingProgress } from "@/components/docs/reading-progress";
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
    },
  });

  if (!document) notFound();

  const session = await getServerSession();
  if (!canViewRepo(document.repository, session?.user.id)) notFound();

  const isAuthor = session?.user.id === document.authorId;
  await recordDocumentView(document.id, session?.user.id);

  const [stats, tree, comments, userLike, userBookmark, userRating, relatedDocs] =
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
      prisma.document.findMany({
        where: { repositoryId: document.repositoryId, NOT: { id: document.id } },
        take: 4,
        select: { title: true, slug: true },
      }),
    ]);

  const basePath = `/r/${document.repository.owner.username}/${document.repository.slug}`;
  const serializedComments = comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    replies: c.replies.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), replies: [] })),
  }));

  return (
    <div className="flex min-h-full">
      <div className="w-56 shrink-0 border-r border-border hidden lg:block">
        <RepoTree tree={tree} basePath={basePath} activeSlug={docSlug} />
      </div>

      <div className="flex flex-1 min-w-0">
        <article className="flex-1 min-w-0" data-article>
          <ReadingProgress />
          <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10">
            <Breadcrumbs
              items={[
                { label: formatUsername(document.repository.owner.username), href: `/u/${document.repository.owner.username}` },
                { label: document.repository.name, href: basePath },
                { label: document.title },
              ]}
            />

            <header className="mt-8 mb-10">
              <h1 className="font-serif text-4xl sm:text-[2.6rem] tracking-tight leading-[1.12]">
                {document.title}
              </h1>
              <div className="mt-5 flex items-center gap-3">
                <Link href={`/u/${document.author.username}`}>
                  <Avatar src={document.author.image} name={document.author.name || document.author.username} />
                </Link>
                <div className="min-w-0">
                  <Link href={`/u/${document.author.username}`} className="text-sm font-medium hover:underline">
                    {document.author.name || formatUsername(document.author.username)}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(document.updatedAt, { addSuffix: true })} · {document.readingMinutes} min read
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <DocStatsHeader stats={stats} />
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <DocActions
                  documentId={document.id}
                  initialLiked={!!userLike}
                  initialBookmarked={!!userBookmark}
                  initialRating={userRating?.value}
                  likeCount={stats.likeCount}
                  signedIn={!!session}
                />
                {isAuthor && (
                  <Link href={`${basePath}/${docSlug}/edit`}>
                    <Button variant="outline" size="sm" className="rounded-full">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                  </Link>
                )}
              </div>
            </header>

            <MarkdownRenderer content={document.content} />

            <aside className="mt-14 rounded-2xl border border-border p-5 flex gap-4">
              <Avatar src={document.author.image} name={document.author.name || document.author.username} size="lg" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Written by</p>
                <Link href={`/u/${document.author.username}`} className="font-medium hover:underline">
                  {document.author.name || formatUsername(document.author.username)}
                </Link>
                {document.author.bio && (
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{document.author.bio}</p>
                )}
              </div>
            </aside>

            <CommentSection
              documentId={document.id}
              initialComments={serializedComments}
              currentUserId={session?.user.id}
            />
          </div>
        </article>

        <RightSidebar
          content={document.content}
          stats={stats}
          relatedDocs={relatedDocs.map((d) => ({
            title: d.title,
            href: `${basePath}/${d.slug}`,
          }))}
        />
      </div>
    </div>
  );
}
