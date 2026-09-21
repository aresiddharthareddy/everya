import Link from "next/link";
import { ArrowRight, Eye, Heart, FileText } from "lucide-react";
import { LandingHero } from "@/components/landing/hero";
import { prisma } from "@/lib/prisma";
import { formatUsername, formatCount, formatRating } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

export default async function LandingPage() {
  const [repos, docs, totals] = await Promise.all([
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
        author: { select: { username: true, name: true, image: true } },
        ratings: { select: { value: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { readerCount: "desc" },
    }),
    prisma.document.aggregate({ _sum: { readerCount: true }, _count: true }),
  ]);

  const totalViews = totals._sum.readerCount || 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 chrome-bar">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="font-semibold tracking-[0.2em] text-[11px]">
            EVERYA
          </Link>
          <nav className="flex items-center gap-1 sm:gap-3">
            <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full hover:bg-muted">
              Explore
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 hidden sm:inline">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background hover:opacity-90"
            >
              Start reading
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <LandingHero />

        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-10 grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-semibold tabular-nums">{formatCount(totalViews)}</p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Total reads</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold tabular-nums">{totals._count}</p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Stories published</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold tabular-nums">{repos.length}+</p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Collections</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Trending</p>
              <h2 className="font-serif text-3xl tracking-tight">Popular stories</h2>
            </div>
            <Link href="/explore" className="text-sm font-medium inline-flex items-center gap-1 hover:underline">
              See all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No public stories yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {docs.map((doc) => {
                const avg =
                  doc.ratings.length > 0
                    ? doc.ratings.reduce((s, r) => s + r.value, 0) / doc.ratings.length
                    : 0;
                return (
                  <Link
                    key={doc.id}
                    href={`/r/${doc.repository.owner.username}/${doc.repository.slug}/${doc.slug}`}
                    className="stat-card p-6 group hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar src={doc.author.image} name={doc.author.name || doc.author.username} size="sm" />
                      <p className="text-xs text-muted-foreground">{formatUsername(doc.author.username)}</p>
                    </div>
                    <h3 className="font-serif text-xl tracking-tight group-hover:underline underline-offset-4 leading-snug">
                      {doc.title}
                    </h3>
                    {doc.excerpt && (
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">{doc.excerpt}</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{formatCount(doc.readerCount)}</span>
                      <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{doc._count.likes}</span>
                      <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" />{doc._count.comments}</span>
                      {avg > 0 && <span>{formatRating(avg)} ★</span>}
                      <span>{doc.readingMinutes} min</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-muted/20 border-t border-border py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-serif text-3xl tracking-tight mb-8">Collections</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {repos.map((repo) => (
                <Link
                  key={repo.id}
                  href={`/r/${repo.owner.username}/${repo.slug}`}
                  className="stat-card p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-medium">{repo.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{formatUsername(repo.owner.username)}</p>
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{repo.description}</p>
                  <p className="text-xs mt-4 font-medium">{repo._count.documents} stories</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} EVERYA — Read deeper. Write better.
      </footer>
    </div>
  );
}
