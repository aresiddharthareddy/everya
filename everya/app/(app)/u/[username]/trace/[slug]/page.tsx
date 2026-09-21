import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Plus, Upload } from "lucide-react";
import { getTraceByPath, getTraceTree, traceHref, assertCanViewTrace } from "@/services/traces";
import { KnowledgeTree } from "@/components/knowledge/knowledge-tree";
import { KnowledgeNav } from "@/components/navigation/knowledge-nav";
import { PageHeader } from "@/components/navigation/page-header";
import { AuthorIdentity } from "@/components/content/author-identity";
import { TraceFollowButton } from "@/components/social/trace-follow-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCount, formatUsername } from "@/lib/utils";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function TracePage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;
  const session = await getServerSession();
  const trace = await getTraceByPath(username, slug);
  if (!trace || !assertCanViewTrace(trace, session?.user.id)) notFound();

  const isOwner = session?.user.id === trace.ownerId;
  const [tree, isFollowing] = await Promise.all([
    getTraceTree(trace.id),
    session && !isOwner
      ? prisma.traceFollow
          .findUnique({
            where: { repositoryId_userId: { repositoryId: trace.id, userId: session.user.id } },
          })
          .then((r) => !!r)
      : Promise.resolve(false),
  ]);
  const basePath = traceHref(trace);

  return (
    <div className="flex h-full">
      <div className="w-60 shrink-0 border-r border-border overflow-y-auto hidden md:block">
        <div className="p-3 border-b border-border">
          <p className="typo-caption">Contents</p>
        </div>
        <KnowledgeTree tree={tree} basePath={basePath} />
      </div>

      <div className="flex-1 overflow-y-auto page-container py-page">
        <KnowledgeNav
          items={[
            { label: formatUsername(trace.owner.username), href: `/u/${trace.owner.username}` },
            { label: trace.name },
          ]}
        />
        <PageHeader
          eyebrow="Trace"
          title={trace.name}
          description={trace.description || undefined}
          actions={
            <div className="flex flex-wrap gap-2">
              <TraceFollowButton
                username={trace.owner.username}
                slug={trace.slug}
                initialFollowing={isFollowing}
                signedIn={!!session}
                isOwner={isOwner}
              />
              {isOwner && (
                <>
                  <Link href="/create/import-trace">
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4" /> Import
                    </Button>
                  </Link>
                  <Link href={`${basePath}/new`}>
                    <Button size="sm">
                      <Plus className="h-4 w-4" /> New document
                    </Button>
                  </Link>
                </>
              )}
            </div>
          }
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <AuthorIdentity
            size="sm"
            name={trace.owner.name}
            username={trace.owner.username}
            image={trace.owner.image}
            href={`/u/${trace.owner.username}`}
            meta="Owner"
          />
          <Badge variant="outline">{trace.visibility}</Badge>
          <span className="typo-meta">
            {trace._count?.documents ?? 0} documents · {formatCount(trace._count?.followers ?? 0)} followers
          </span>
        </div>

        <div className="mt-8 md:hidden">
          <KnowledgeTree tree={tree} basePath={basePath} />
        </div>

        <section className="mt-10">
          <h2 className="typo-caption mb-4">All documents</h2>
          {tree.length === 0 ? (
            <p className="typo-body-sm text-muted-foreground py-8">No documents yet.</p>
          ) : (
            <DocumentLinks tree={tree} basePath={basePath} />
          )}
        </section>
      </div>
    </div>
  );
}

function DocumentLinks({
  tree,
  basePath,
}: {
  tree: { type: string; name: string; slug: string; children?: unknown[] }[];
  basePath: string;
}) {
  const links: { name: string; href: string }[] = [];
  const walk = (nodes: typeof tree) => {
    for (const node of nodes) {
      if (node.type === "document") links.push({ name: node.name, href: `${basePath}/${node.slug}` });
      if (node.children) walk(node.children as typeof tree);
    }
  };
  walk(tree);

  return (
    <div className="divide-y divide-border surface-bordered overflow-hidden">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="flex items-center gap-2 px-4 py-3 typo-body-sm hover:bg-muted/40 motion-fast min-h-[44px]"
        >
          <FileText className="h-4 w-4 text-muted-foreground" />
          {link.name}
        </Link>
      ))}
    </div>
  );
}
