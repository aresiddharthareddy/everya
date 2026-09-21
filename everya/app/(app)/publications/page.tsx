import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { PageHeader } from "@/components/navigation/page-header";
import { PublicationIdentity } from "@/components/content/publication-identity";
import { EmptyState } from "@/components/everya/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { formatCount } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function PublicationsPage() {
  const session = await getServerSession();

  const publications = await prisma.publication.findMany({
    where: { visibility: "PUBLIC" },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      owner: { select: { username: true, name: true } },
      _count: { select: { followers: true, articles: true } },
    },
  });

  return (
    <div className="min-h-full bg-muted/15">
      <div className="page-container py-page max-w-4xl">
        <PageHeader
          eyebrow="Discover"
          title="Publications"
          description="Magazines, teams, and editorial homes on EveryA."
          actions={
            session ? (
              <Link href="/publications/new" className={buttonVariants({ size: "sm" })}>
                <Plus className="h-3.5 w-3.5" /> New publication
              </Link>
            ) : undefined
          }
        />

        {publications.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No publications yet"
              description="Public publications will appear here as creators launch editorial homes."
              actionLabel={session ? "Create a publication" : "Explore articles"}
              actionHref={session ? "/publications/new" : "/explore"}
            />
          </div>
        ) : (
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {publications.map((pub) => (
              <Link
                key={pub.id}
                href={`/p/${pub.handle}`}
                className="surface-bordered p-5 hover:bg-muted/30 motion-fast block"
              >
                <PublicationIdentity name={pub.name} handle={pub.handle} description={pub.description} />
                <p className="typo-meta mt-3">
                  {pub._count.articles} articles · {formatCount(pub._count.followers)} followers ·{" "}
                  {pub.owner.name || `@${pub.owner.username}`}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
