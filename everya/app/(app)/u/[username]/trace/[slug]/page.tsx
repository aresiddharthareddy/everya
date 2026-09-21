import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tracePageHref } from "@/lib/share-url";
import { Download, FileText, GitBranch, Plus, Upload } from "lucide-react";
import {
  getTraceByPath,
  getTraceTree,
  getTraceMembers,
  traceHref,
  assertCanViewTrace,
} from "@/services/traces";
import { getTraceDrafts } from "@/services/drafts";
import { DraftList } from "@/components/writing/draft-list";
import { KnowledgeTree } from "@/components/knowledge/knowledge-tree";
import { KnowledgeNav } from "@/components/navigation/knowledge-nav";
import { PageHeader } from "@/components/navigation/page-header";
import { AuthorIdentity } from "@/components/content/author-identity";
import { TraceFollowButton } from "@/components/social/trace-follow-button";
import { TraceMembersPanel } from "@/components/knowledge/trace-members-panel";
import { TraceContributorsStrip } from "@/components/knowledge/trace-contributors-strip";
import { getTraceContributorRoster } from "@/services/collaboration";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCount, formatUsername } from "@/lib/utils";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  canEditTraceContent,
  canManageTraceMembers,
  getTraceRole,
} from "@/lib/permissions/trace";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}): Promise<Metadata> {
  const { username, slug } = await params;
  const trace = await getTraceByPath(username, slug);
  if (!trace) return { title: "Trace not found" };
  const path = tracePageHref(trace.owner.username, trace.slug);
  return {
    title: trace.name,
    description: trace.description || undefined,
    alternates: { canonical: path },
    openGraph: { title: trace.name, description: trace.description || undefined, url: path },
  };
}

export default async function TracePage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;
  const session = await getServerSession();
  const trace = await getTraceByPath(username, slug);
  if (!trace || !(await assertCanViewTrace(trace, session?.user.id))) notFound();

  const traceRole = session ? await getTraceRole(trace.id, session.user.id) : null;
  const canEdit = traceRole ? canEditTraceContent(traceRole) : false;
  const canManage = traceRole ? canManageTraceMembers(traceRole) : false;
  const isOwner = session?.user.id === trace.ownerId;

  const [tree, isFollowing, members, drafts, roster] = await Promise.all([
    getTraceTree(trace.id, { includeDrafts: canEdit }),
    session && !isOwner
      ? prisma.traceFollow
          .findUnique({
            where: { repositoryId_userId: { repositoryId: trace.id, userId: session.user.id } },
          })
          .then((r) => !!r)
      : Promise.resolve(false),
    canManage ? getTraceMembers(trace.id) : Promise.resolve([]),
    canEdit && session ? getTraceDrafts(trace.id, session.user.id) : Promise.resolve([]),
    getTraceContributorRoster(trace.id),
  ]);
  const basePath = traceHref(trace);
  const exportUrl = `/api/traces/${trace.owner.username}/${trace.slug}/export`;

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
              <Link href={`${basePath}/knowledge`}>
                <Button variant="outline" size="sm">
                  <GitBranch className="h-4 w-4" /> Knowledge
                </Button>
              </Link>
              <TraceFollowButton
                username={trace.owner.username}
                slug={trace.slug}
                initialFollowing={isFollowing}
                signedIn={!!session}
                isOwner={isOwner}
              />
              {canEdit && (
                <>
                  <a href={exportUrl} download>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" /> Export
                    </Button>
                  </a>
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
            {trace._count?.members ? ` · ${trace._count.members} contributors` : ""}
          </span>
        </div>

        {roster && <TraceContributorsStrip owner={roster.owner} members={roster.members} />}

        {canManage && (
          <TraceMembersPanel
            username={trace.owner.username}
            slug={trace.slug}
            members={members}
            ownerUsername={trace.owner.username}
          />
        )}

        <div className="mt-8 md:hidden">
          <KnowledgeTree tree={tree} basePath={basePath} />
        </div>

        {canEdit && drafts.length > 0 && (
          <section className="mt-10">
            <h2 className="typo-caption mb-4">Drafts</h2>
            <DraftList drafts={drafts} />
          </section>
        )}

        <section className="mt-10">
          <h2 className="typo-caption mb-4">All documents</h2>
          {tree.length === 0 ? (
            <p className="typo-body-sm text-muted-foreground py-8">No documents yet.</p>
          ) : (
            <DocumentList tree={tree} basePath={basePath} />
          )}
        </section>
      </div>
    </div>
  );
}

function DocumentList({
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
