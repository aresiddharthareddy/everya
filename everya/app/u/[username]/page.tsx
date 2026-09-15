import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, FolderGit2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatUsername, formatCount } from "@/lib/utils";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username: raw } = await params;
  const username = raw.replace(/^@/, "");
  const session = await getServerSession();

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      repositories: {
        include: { _count: { select: { documents: true } } },
        orderBy: { updatedAt: "desc" },
      },
      documents: {
        take: 20,
        orderBy: { readerCount: "desc" },
        include: {
          repository: {
            select: { slug: true, name: true, visibility: true, owner: { select: { username: true } } },
          },
        },
      },
    },
  });

  if (!user) notFound();
  const isOwner = session?.user.id === user.id;
  const repos = user.repositories.filter((r) => isOwner || r.visibility === "PUBLIC");
  const docs = user.documents.filter((d) => isOwner || d.repository.visibility === "PUBLIC");
  const totalReaders = docs.reduce((s, d) => s + d.readerCount, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold text-xs tracking-[0.16em]">
            EVERYA
          </Link>
          <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground">
            Explore
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex items-start gap-6">
          <Avatar src={user.image} name={user.name || user.username} size="lg" />
          <div>
            <h1 className="font-serif text-3xl tracking-tight">{user.name || formatUsername(user.username)}</h1>
            <p className="text-muted-foreground">{formatUsername(user.username)}</p>
            {user.bio && <p className="text-sm mt-2 max-w-lg leading-relaxed">{user.bio}</p>}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <FolderGit2 className="h-3.5 w-3.5" /> {repos.length} collections
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> {docs.length} stories
              </span>
              <span>{formatCount(totalReaders)} readers</span>
            </div>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Collections</h2>
          {repos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No public collections.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {repos.map((repo) => (
                <Link
                  key={repo.id}
                  href={`/r/${user.username}/${repo.slug}`}
                  className="rounded-xl border border-border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{repo.name}</span>
                    <Badge variant="outline">{repo.visibility}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{repo._count.documents} stories</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Stories</h2>
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No published stories yet.</p>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border">
              {docs.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/r/${doc.repository.owner.username}/${doc.repository.slug}/${doc.slug}`}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
                >
                  <span>{doc.title}</span>
                  <span className="text-muted-foreground">{formatCount(doc.readerCount)} readers</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
