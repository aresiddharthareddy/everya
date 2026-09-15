import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatUsername, formatCount } from "@/lib/utils";

export default async function ExplorePage() {
  const [repos, docs] = await Promise.all([
    prisma.repository.findMany({
      where: { visibility: "PUBLIC" },
      include: { owner: { select: { username: true } }, _count: { select: { documents: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.document.findMany({
      where: { repository: { visibility: "PUBLIC" } },
      include: {
        author: { select: { username: true, name: true } },
        repository: { select: { name: true, slug: true, owner: { select: { username: true } } } },
      },
      orderBy: { readerCount: "desc" },
      take: 24,
    }),
  ]);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-12">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Explore</h1>
        <p className="text-sm text-muted-foreground mt-1">Staff-grade writing and public collections</p>
      </div>

      <section>
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-6">Stories</h2>
        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing public yet.</p>
        ) : (
          <div className="space-y-10">
            {docs.map((doc) => (
              <Link key={doc.id} href={`/r/${doc.repository.owner.username}/${doc.repository.slug}/${doc.slug}`} className="block group">
                <p className="text-xs text-muted-foreground">
                  {formatUsername(doc.author.username)} in {doc.repository.name}
                </p>
                <h3 className="mt-1 font-serif text-2xl tracking-tight group-hover:underline underline-offset-4">
                  {doc.title}
                </h3>
                {doc.excerpt && (
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">{doc.excerpt}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {doc.readingMinutes} min · {formatCount(doc.readerCount)} readers
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Collections</h2>
        {repos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No public collections.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {repos.map((repo) => (
              <Link
                key={repo.id}
                href={`/r/${repo.owner.username}/${repo.slug}`}
                className="rounded-xl border border-border p-4 hover:bg-muted/50 transition-colors"
              >
                <p className="font-medium">{repo.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatUsername(repo.owner.username)}</p>
                {repo.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{repo.description}</p>
                )}
                <p className="text-xs mt-3">{repo._count.documents} stories</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
