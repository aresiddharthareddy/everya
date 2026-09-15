import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { getRepositoryByPath, getRepositoryTree } from "@/services/repositories";
import { canViewRepo } from "@/lib/access";
import { Breadcrumbs } from "@/components/repos/breadcrumbs";
import { RepoTree } from "@/components/repos/repo-tree";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatUsername } from "@/lib/utils";
import { getServerSession } from "@/lib/session";

export default async function RepositoryPage({
  params,
}: {
  params: Promise<{ username: string; repo: string }>;
}) {
  const { username, repo: repoSlug } = await params;
  const repo = await getRepositoryByPath(username, repoSlug);
  if (!repo) notFound();

  const session = await getServerSession();
  if (!canViewRepo(repo, session?.user.id)) notFound();
  const isOwner = session?.user.id === repo.owner.id;
  const tree = await getRepositoryTree(repo.id);
  const basePath = `/r/${repo.owner.username}/${repo.slug}`;

  return (
    <div className="flex h-full">
      <div className="w-60 shrink-0 border-r border-border overflow-y-auto hidden md:block">
        <div className="p-3 border-b border-border">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Contents
          </p>
        </div>
        <RepoTree tree={tree} basePath={basePath} />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <Breadcrumbs
          items={[
            { label: formatUsername(repo.owner.username), href: `/u/${repo.owner.username}` },
            { label: repo.name },
          ]}
        />

        <div className="mt-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-semibold tracking-tight">{repo.name}</h1>
              <Badge variant="outline">{repo.visibility}</Badge>
            </div>
            {repo.description && (
              <p className="text-muted-foreground text-sm max-w-xl">{repo.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {repo._count.documents} documents · {formatUsername(repo.owner.username)}
            </p>
          </div>
          {isOwner && (
            <Link href={`${basePath}/new`}>
              <Button size="sm">
                <Plus className="h-4 w-4" /> New doc
              </Button>
            </Link>
          )}
        </div>

        <div className="mt-8 md:hidden">
          <RepoTree tree={tree} basePath={basePath} />
        </div>

        <div className="mt-8 space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            All documents
          </h2>
          {tree.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8">No documents yet.</p>
          ) : (
            <DocumentLinks tree={tree} basePath={basePath} />
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentLinks({ tree, basePath }: { tree: { type: string; name: string; slug: string; children?: unknown[] }[]; basePath: string }) {
  const links: { name: string; href: string }[] = [];

  const walk = (nodes: typeof tree) => {
    for (const node of nodes) {
      if (node.type === "document") links.push({ name: node.name, href: `${basePath}/${node.slug}` });
      if (node.children) walk(node.children as typeof tree);
    }
  };
  walk(tree);

  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
        >
          <FileText className="h-4 w-4 text-muted-foreground" />
          {link.name}
        </Link>
      ))}
    </div>
  );
}
