import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, GitBranch, Link2, Layers } from "lucide-react";
import type { DocumentLinkType } from "@prisma/client";
import { linkTypeLabel } from "@/services/document-links";

const icons: Partial<Record<DocumentLinkType, typeof Link2>> = {
  RELATED: Link2,
  REFERENCES: BookOpen,
  DEPENDS_ON: GitBranch,
  PREVIOUS: ArrowLeft,
  NEXT: ArrowRight,
  PART_OF: Layers,
};

type LinkItem = {
  id: string;
  type: DocumentLinkType;
  href: string;
  document: { title: string };
};

function LinkGroup({ title, links }: { title: string; links: LinkItem[] }) {
  if (!links.length) return null;
  return (
    <div>
      <p className="typo-meta mb-2">{title}</p>
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

export function DocumentKnowledgePanel({
  trace,
  outbound,
  inbound,
  references,
  referencedBy,
  dependencies,
  partOf,
}: {
  trace?: { name: string; href: string };
  outbound: LinkItem[];
  inbound: LinkItem[];
  references: LinkItem[];
  referencedBy: LinkItem[];
  dependencies: LinkItem[];
  partOf: LinkItem[];
}) {
  const related = outbound.filter((l) => l.type === "RELATED");
  const hasContent =
    related.length ||
    references.length ||
    referencedBy.length ||
    dependencies.length ||
    partOf.length ||
    trace;

  if (!hasContent) return null;

  return (
    <section className="mt-10 pt-8 border-t border-border" aria-label="Knowledge">
      <h2 className="typo-caption mb-4">Knowledge</h2>
      <div className="space-y-4">
        {trace && (
          <div>
            <p className="typo-meta mb-2">Part of trace</p>
            <Link
              href={trace.href}
              className="flex items-center gap-2 px-4 py-3 typo-body-sm surface-bordered hover:bg-muted/40 motion-fast min-h-[44px]"
            >
              <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
              {trace.name}
            </Link>
          </div>
        )}
        <LinkGroup title={linkTypeLabel("RELATED")} links={related} />
        <LinkGroup title="References" links={references} />
        <LinkGroup title="Referenced by" links={referencedBy} />
        <LinkGroup title={linkTypeLabel("DEPENDS_ON")} links={dependencies} />
        <LinkGroup title={linkTypeLabel("PART_OF")} links={partOf} />
      </div>
    </section>
  );
}
