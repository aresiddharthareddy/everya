import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bookmark } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatUsername, formatCount } from "@/lib/utils";

export default async function ReadingListPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/reading-list");

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      document: {
        include: {
          author: { select: { username: true, name: true } },
          repository: { select: { name: true, slug: true, owner: { select: { username: true } } } },
          tags: { include: { tag: { select: { name: true, slug: true } } } },
        },
      },
    },
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-3xl tracking-tight">Reading list</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {bookmarks.length} saved {bookmarks.length === 1 ? "story" : "stories"}
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Bookmark className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Save stories to read later from any article.</p>
          <Link href="/explore" className="inline-block mt-4 text-sm font-medium hover:underline">
            Explore stories
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {bookmarks.map((b) => {
            const doc = b.document;
            const href = `/r/${doc.repository.owner.username}/${doc.repository.slug}/${doc.slug}`;
            return (
              <Link key={b.id} href={href} className="block py-6 group">
                <p className="text-xs text-muted-foreground">
                  {doc.author.name || formatUsername(doc.author.username)} · {doc.repository.name}
                </p>
                <h2 className="mt-1 font-serif text-xl tracking-tight group-hover:underline underline-offset-4">
                  {doc.title}
                </h2>
                {doc.excerpt && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">{doc.excerpt}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {doc.readingMinutes} min · {formatCount(doc.readerCount)} readers · saved{" "}
                  {formatDistanceToNow(b.createdAt, { addSuffix: true })}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
