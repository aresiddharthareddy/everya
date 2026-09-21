import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, FolderGit2, Newspaper, Plus } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/navigation/page-header";
import { Surface } from "@/components/ui/surface";
import { buttonVariants } from "@/components/ui/button";

export default async function CreatePage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/create");

  const [publications, collections] = await Promise.all([
    prisma.publication.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      select: { handle: true, name: true },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.repository.findMany({
      where: { ownerId: session.user.id },
      select: { slug: true, name: true, owner: { select: { username: true } } },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
  ]);

  return (
    <div className="page-container py-page max-w-2xl">
      <PageHeader
        eyebrow="Create"
        title="What do you want to create?"
        description="Publish an article, start a publication, or add to a collection."
      />

      <div className="mt-10 space-y-4">
        <Surface variant="bordered" padding="md" className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <FileText className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="typo-section-title">Article</h2>
              <p className="typo-body-sm text-muted-foreground mt-1">Long-form writing in a publication.</p>
              {publications.length === 0 ? (
                <p className="typo-meta mt-3">Create a publication first to publish articles.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {publications.map((pub) => (
                    <li key={pub.handle}>
                      <Link
                        href={`/p/${pub.handle}/write`}
                        className="typo-body-sm hover:underline underline-offset-4"
                      >
                        Write in {pub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Surface>

        <Surface variant="bordered" padding="md">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                <Newspaper className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h2 className="typo-section-title">Publication</h2>
                <p className="typo-body-sm text-muted-foreground mt-1">An editorial home for your articles.</p>
              </div>
            </div>
            <Link href="/publications/new" className={buttonVariants({ size: "sm" })}>
              <Plus className="h-3.5 w-3.5" /> New
            </Link>
          </div>
        </Surface>

        <Surface variant="bordered" padding="md" className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <FolderGit2 className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="typo-section-title">Trace</h2>
                  <p className="typo-body-sm text-muted-foreground mt-1">Structured knowledge with documents and folders.</p>
                </div>
                <div className="flex gap-2">
                  <Link href="/dashboard/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    New trace
                  </Link>
                  <Link href="/create/import-trace" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Import
                  </Link>
                </div>
              </div>
              {collections.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {collections.map((repo) => (
                    <li key={repo.slug}>
                      <Link
                        href={`/u/${repo.owner.username}/trace/${repo.slug}/new`}
                        className="typo-body-sm hover:underline underline-offset-4"
                      >
                        New document in {repo.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}
