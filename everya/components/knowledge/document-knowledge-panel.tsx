import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, GitBranch, Link2, Layers, Tag } from "lucide-react";
import type { DocumentLinkType } from "@prisma/client";
import { linkTypeLabel } from "@/services/document-links";
import type { DocRefView, KnowledgeLinkView, SharedTagGroup } from "@/services/knowledge";

const icons: Partial<Record<DocumentLinkType, typeof Link2>> = {
  RELATED: Link2,
  REFERENCES: BookOpen,
  DEPENDS_ON: GitBranch,
  PREVIOUS: ArrowLeft,
  NEXT: ArrowRight,
  PART_OF: Layers,
};

type LinkItem = KnowledgeLinkView;

function LinkGroup({ title, hint, links }: { title: string; hint?: string; links: LinkItem[] }) {
  if (!links.length) return null;
  return (
    <div>
      <p className="typo-meta mb-1">{title}</p>
      {hint && <p className="text-[11px] text-muted-foreground mb-2">{hint}</p>}
      <div className="divide-y divide-border surface-bordered overflow-hidden">
        {links.map((link) => {
          const Icon = icons[link.type] || Link2;
          return (
            <Link
              key={link.id}
              href={link.href}
              className="flex items-center gap-2 px-4 py-3 typo-body-sm hover:bg-muted/40 motion-fast min-h-[44px]"
            >
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              {link.document.title}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function RefList({ title, hint, items }: { title: string; hint?: string; items: DocRefView[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="typo-meta mb-1">{title}</p>
      {hint && <p className="text-[11px] text-muted-foreground mb-2">{hint}</p>}
      <div className="divide-y divide-border surface-bordered overflow-hidden">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-center gap-2 px-4 py-3 typo-body-sm hover:bg-muted/40 motion-fast min-h-[44px]"
          >
            <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
            {item.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function DocumentKnowledgePanel({
  trace,
  publication,
  outbound,
  inbound,
  references,
  referencedBy,
  dependencies,
  partOf,
  previous,
  next,
  sameTrace,
  sharedTags,
}: {
  trace?: { name: string; href: string };
  publication?: { name: string; href: string } | null;
  outbound: LinkItem[];
  inbound: LinkItem[];
  references: LinkItem[];
  referencedBy: LinkItem[];
  dependencies: LinkItem[];
  partOf: LinkItem[];
  previous?: LinkItem | null;
  next?: LinkItem | null;
  sameTrace?: DocRefView[];
  sharedTags?: SharedTagGroup[];
}) {
  const related = outbound.filter((l) => l.type === "RELATED");
  const hasContent =
    related.length ||
    references.length ||
    referencedBy.length ||
    dependencies.length ||
    partOf.length ||
    previous ||
    next ||
    (sameTrace?.length ?? 0) > 0 ||
    (sharedTags?.length ?? 0) > 0 ||
    trace ||
    publication;

  if (!hasContent) return null;

  return (
    <section className="mt-10 pt-8 border-t border-border" aria-label="Knowledge">
      <h2 className="typo-caption mb-4">Knowledge</h2>
      <div className="space-y-4">
        {publication && (
          <div>
            <p className="typo-meta mb-2">Publication</p>
            <Link
              href={publication.href}
              className="flex items-center gap-2 px-4 py-3 typo-body-sm surface-bordered hover:bg-muted/40 motion-fast min-h-[44px]"
            >
              <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              {publication.name}
            </Link>
          </div>
        )}
        {trace && (
          <div>
            <p className="typo-meta mb-2">Trace</p>
            <Link
              href={trace.href}
              className="flex items-center gap-2 px-4 py-3 typo-body-sm surface-bordered hover:bg-muted/40 motion-fast min-h-[44px]"
            >
              <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
              {trace.name}
            </Link>
          </div>
        )}
        {(previous || next) && (
          <div>
            <p className="typo-meta mb-1">Reading order</p>
            <p className="text-[11px] text-muted-foreground mb-2">Explicit author links</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {previous && (
                <Link href={previous.href} className="flex items-center gap-2 px-4 py-3 typo-body-sm surface-bordered hover:bg-muted/40 min-h-[44px]">
                  <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{previous.document.title}</span>
                </Link>
              )}
              {next && (
                <Link href={next.href} className="flex items-center gap-2 px-4 py-3 typo-body-sm surface-bordered hover:bg-muted/40 min-h-[44px]">
                  <span className="truncate flex-1">{next.document.title}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              )}
            </div>
          </div>
        )}
        <LinkGroup title={linkTypeLabel("RELATED")} hint="Explicit relationship" links={related} />
        <LinkGroup title="References" hint="Explicit relationship" links={references} />
        <LinkGroup title="Referenced by" hint="Explicit relationship" links={referencedBy} />
        <LinkGroup title={linkTypeLabel("DEPENDS_ON")} hint="Explicit relationship" links={dependencies} />
        <LinkGroup title={linkTypeLabel("PART_OF")} hint="Explicit relationship" links={partOf} />
        <RefList title="Same trace" hint="Shared structure" items={sameTrace ?? []} />
        {sharedTags?.map((group) => (
          <div key={group.tag}>
            <p className="typo-meta mb-1 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" /> Shared tag: {group.tag}
            </p>
            <p className="text-[11px] text-muted-foreground mb-2">Shared metadata</p>
            <div className="divide-y divide-border surface-bordered overflow-hidden">
              {group.documents.map((item) => (
                <Link key={item.id} href={item.href} className="flex items-center gap-2 px-4 py-3 typo-body-sm hover:bg-muted/40 min-h-[44px]">
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
