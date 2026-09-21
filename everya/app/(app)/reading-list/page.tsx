import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bookmark } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { articleHref } from "@/services/feed";
import { formatUsername } from "@/lib/utils";
import { PageHeader } from "@/components/navigation/page-header";
import { EmptyState } from "@/components/everya/empty-state";
import { FeedDocumentCard } from "@/components/feed/feed-document-card";
import { Surface } from "@/components/ui/surface";

export default async function ReadingListPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/reading-list");

  const [bookmarks, continueReading] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        document: {
          include: {
            author: { select: { username: true, name: true, image: true } },
            publication: { select: { handle: true, name: true, logo: true } },
            repository: { select: { name: true, slug: true, owner: { select: { username: true } } } },
            tags: { include: { tag: { select: { name: true, slug: true } } } },
            _count: { select: { likes: true, comments: true } },
          },
        },
      },
    }),
    prisma.readingProgress.findMany({
      where: { userId: session.user.id, progress: { lt: 1, gt: 0 } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: {
        document: {
          include: {
            author: { select: { username: true, name: true, image: true } },
            publication: { select: { handle: true, name: true, logo: true } },
            repository: { select: { slug: true, name: true, owner: { select: { username: true } } } },
          },
        },
      },
    }),
  ]);

  return (
    <div className="page-container py-page max-w-2xl">
      <PageHeader
        eyebrow="Library"
        title="Your library"
        description={`${bookmarks.length} saved ${bookmarks.length === 1 ? "article" : "articles"} · continue reading and bookmarks in one place.`}
      />

      {continueReading.length > 0 && (
        <section className="mb-12">
          <h2 className="typo-caption mb-4">Continue reading</h2>
          <Surface variant="bordered" className="divide-y divide-border overflow-hidden">
            {continueReading.map((row) => {
              const doc = row.document;
              const href = articleHref(doc);
              const pct = Math.round(row.progress * 100);
              return (
                <Link key={row.id} href={href} className="block px-4 py-4 hover:bg-muted/40 motion-fast group min-h-[44px]">
                  <p className="typo-meta">
                    {doc.author.name || formatUsername(doc.author.username)}
                    {doc.publication ? ` · ${doc.publication.name}` : ""}
                  </p>
                  <h3 className="mt-1 typo-nav group-hover:underline underline-offset-4">{doc.title}</h3>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-full bg-foreground rounded-full motion-normal" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="typo-meta shrink-0">{pct}%</span>
                  </div>
                  <p className="mt-2 typo-meta">
                    {doc.readingMinutes} min · updated {formatDistanceToNow(row.updatedAt, { addSuffix: true })}
                  </p>
                </Link>
              );
            })}
          </Surface>
        </section>
      )}

      {bookmarks.length === 0 ? (
        <EmptyState
          title="No bookmarks yet"
          description="Save articles to read later from any article page."
          actionLabel="Explore"
          actionHref="/explore"
          icon={<Bookmark className="h-8 w-8" />}
        />
      ) : (
        <section>
          <h2 className="typo-caption mb-4">Saved</h2>
          <div>
            {bookmarks.map((b) => (
              <FeedDocumentCard
                key={b.id}
                doc={{
                  ...b.document,
                  excerpt: b.document.excerpt,
                  readerCount: b.document.readerCount,
                  ratings: [],
                }}
                variant="compact"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
