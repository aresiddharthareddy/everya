import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, FileText, FolderGit2 } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUsername } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const user = session.user as { id: string; username?: string };
  const [repos, recentDocs, bookmarks] = await Promise.all([
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
  ]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Your desk</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {user.username ? formatUsername(user.username) : "there"}
          </p>
        </div>
        <Link href="/dashboard/new">
          <Button size="sm">
            <Plus className="h-4 w-4" /> New repository
          </Button>
        </Link>
      </div>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Your repositories
        </h2>
        {repos.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No repositories yet. Create your first collection.
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {repos.map((repo) => (
              <Link key={repo.id} href={`/r/${user.username}/${repo.slug}`}>
                <Card className="hover:bg-muted/50 transition-colors h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FolderGit2 className="h-4 w-4 text-muted-foreground" />
                        {repo.name}
                      </CardTitle>
                      <Badge variant="outline">{repo.visibility}</Badge>
                    </div>
                    <CardDescription className="line-clamp-1">{repo.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{repo._count.documents} documents</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Recent documents
          </h2>
          <div className="space-y-2">
        {recentDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stories yet. Open a collection and write.</p>
            ) : (
              recentDocs.map((doc) => (
              <Link
                key={doc.id}
                href={`/r/${doc.repository.owner.username}/${doc.repository.slug}/${doc.slug}`}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{doc.title}</span>
              </Link>
            ))
            )}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Bookmarks
          </h2>
          <div className="space-y-2">
            {bookmarks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookmarks yet</p>
            ) : (
              bookmarks.map((b) => (
                <Link
                  key={b.id}
                  href={`/r/${b.document.repository.owner.username}/${b.document.repository.slug}/${b.document.slug}`}
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{b.document.title}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
