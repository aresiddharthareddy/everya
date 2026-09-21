import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, FileText, FolderGit2, ArrowRight, BarChart3 } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getWriterStats } from "@/services/stats";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatUsername, formatCount, formatRating } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const user = session.user as { id: string; username?: string };
  const [repos, recentDocs, bookmarks, writerStats] = await Promise.all([
    prisma.repository.findMany({
      where: { ownerId: user.id },
      include: { _count: { select: { documents: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.document.findMany({
      where: { authorId: user.id },
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: { repository: { select: { slug: true, name: true, owner: { select: { username: true } } } } },
    }),
    prisma.bookmark.findMany({
      where: { userId: user.id },
      take: 5,
      include: {
        document: {
          include: { repository: { select: { slug: true, owner: { select: { username: true } } } } },
        },
      },
    }),
    getWriterStats(user.id),
  ]);

  return (
    <div className="min-h-full bg-muted/15">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 py-10 space-y-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Home</p>
            <h1 className="font-serif text-3xl tracking-tight">
              {user.username ? formatUsername(user.username) : "Your desk"}
            </h1>
          </div>
          <div className="flex gap-2">
            <Link href="/stats">
              <Button variant="outline" size="sm" className="rounded-full">
                <BarChart3 className="h-4 w-4" /> Stats
              </Button>
            </Link>
            <Link href="/dashboard/new">
              <Button size="sm" className="rounded-full">
                <Plus className="h-4 w-4" /> New collection
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Views", value: formatCount(writerStats.totalReaders) },
            { label: "Claps", value: formatCount(writerStats.totalLikes) },
            { label: "Followers", value: formatCount(writerStats.followers) },
            { label: "Avg rating", value: formatRating(writerStats.avgRating) },
          ].map((s) => (
            <Link key={s.label} href="/stats" className="stat-card p-5 hover:shadow-md transition-shadow">
              <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</p>
            </Link>
          ))}
        </div>

        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Collections</h2>
          {repos.length === 0 ? (
            <div className="stat-card p-8 text-center text-sm text-muted-foreground">
              No collections yet. Create your first one to start publishing.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {repos.map((repo) => (
                <Link key={repo.id} href={`/r/${user.username}/${repo.slug}`} className="stat-card p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="font-medium flex items-center gap-2">
                      <FolderGit2 className="h-4 w-4 text-muted-foreground" />
                      {repo.name}
                    </span>
                    <Badge variant="outline">{repo.visibility}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{repo._count.documents} stories</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="stat-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Recent stories</h2>
            </div>
            <div className="space-y-1">
              {recentDocs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No stories yet.</p>
              ) : (
                recentDocs.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/r/${doc.repository.owner.username}/${doc.repository.slug}/${doc.slug}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm hover:bg-muted transition-colors"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{doc.title}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
          <div className="stat-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Reading list</h2>
              <Link href="/reading-list" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-1">
              {bookmarks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Nothing saved yet.</p>
              ) : (
                bookmarks.map((b) => (
                  <Link
                    key={b.id}
                    href={`/r/${b.document.repository.owner.username}/${b.document.repository.slug}/${b.document.slug}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm hover:bg-muted transition-colors"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{b.document.title}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
