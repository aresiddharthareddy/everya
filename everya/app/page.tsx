import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingHero } from "@/components/landing/hero";
import { prisma } from "@/lib/prisma";
import { formatUsername, formatCount } from "@/lib/utils";

export default async function LandingPage() {
  const [repos, docs] = await Promise.all([
    prisma.repository.findMany({
      where: { visibility: "PUBLIC" },
      take: 3,
      include: { owner: { select: { username: true, name: true } }, _count: { select: { documents: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.document.findMany({
      where: { repository: { visibility: "PUBLIC" } },
      take: 6,
      include: {
        repository: { select: { name: true, slug: true, owner: { select: { username: true } } } },
        author: { select: { username: true, name: true } },
      },
      orderBy: { readerCount: "desc" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="font-semibold tracking-[0.18em] text-sm">
            EVERYA
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground px-2">
              Explore
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground px-2 hidden sm:inline">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <LandingHero />

        <section className="border-y border-border bg-muted/40">
          <div className="mx-auto max-w-6xl px-6 py-14 grid sm:grid-cols-3 gap-10">
            {[
              { title: "Write like a magazine", desc: "Serif reading, live markdown, and an editor that stays out of the way." },
              { title: "Keep it structured", desc: "Repositories and nested folders so a company wiki never becomes a pile of posts." },
              { title: "See what lands", desc: "Readers, ratings, likes, and discussion on every published piece." },
            ].map((f) => (
              <div key={f.title}>
                <h3 className="font-medium tracking-tight">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-serif text-3xl tracking-tight">Popular stories</h2>
            <Link href="/explore" className="text-sm font-medium inline-flex items-center gap-1 hover:underline">
              All stories <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No public stories yet. Be the first to publish.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {docs.map((doc) => (
                <Link key={doc.id} href={`/r/${doc.repository.owner.username}/${doc.repository.slug}/${doc.slug}`} className="group">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {doc.repository.name} · {formatUsername(doc.author.username)}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl tracking-tight group-hover:underline decoration-1 underline-offset-4">
                    {doc.title}
                  </h3>
                  {doc.excerpt && (
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">{doc.excerpt}</p>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    {doc.readingMinutes} min read · {formatCount(doc.readerCount)} readers
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <h2 className="font-serif text-3xl tracking-tight mb-8">Collections</h2>
          {repos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Public collections will appear here.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {repos.map((repo) => (
                <Link
                  key={repo.id}
                  href={`/r/${repo.owner.username}/${repo.slug}`}
                  className="rounded-2xl border border-border bg-card p-6 hover:bg-muted/40 transition-colors"
                >
                  <h3 className="font-medium">{repo.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{formatUsername(repo.owner.username)}</p>
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2 min-h-[2.5rem]">{repo.description}</p>
                  <p className="text-xs mt-4 font-medium">{repo._count.documents} stories</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} EVERYA. A home for serious writing.
      </footer>
    </div>
  );
}
