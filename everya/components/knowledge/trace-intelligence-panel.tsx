import Link from "next/link";
import { BookOpen, GitBranch, Link2, Tag } from "lucide-react";
import type { DocRefView } from "@/services/knowledge";
import { formatCount } from "@/lib/utils";

type TraceIntelligence = {
  trace: { name: string; href: string };
  description?: string | null;
  documentCount: number;
  relationshipCount: number;
  linkedTraceCount: number;
  topDocuments: (DocRefView & { readerCount: number; readingMinutes: number })[];
  readingPaths: { documents: DocRefView[] }[];
  tags: { name: string; slug: string; count: number }[];
  relatedTraces: { id: string; name: string; href: string; direction: string }[];
  publication?: { name: string; href: string } | null;
};

export function TraceIntelligencePanel({ data }: { data: TraceIntelligence }) {
  const hasContent =
    data.documentCount > 0 ||
    data.relationshipCount > 0 ||
    data.topDocuments.length > 0 ||
    data.readingPaths.length > 0 ||
    data.tags.length > 0 ||
    data.relatedTraces.length > 0;

  if (!hasContent) return null;

  return (
    <section className="mt-10" aria-label="Trace overview">
      <h2 className="typo-caption mb-4">Knowledge overview</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Documents", value: data.documentCount },
          { label: "Relationships", value: data.relationshipCount },
          { label: "Linked traces", value: data.linkedTraceCount },
          { label: "Tags", value: data.tags.length },
        ].map(({ label, value }) => (
          <div key={label} className="stat-card p-4">
            <p className="text-2xl font-semibold tabular-nums">{formatCount(value)}</p>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {data.publication && (
        <p className="text-sm text-muted-foreground mb-4">
          Publication: <Link href={data.publication.href} className="underline">{data.publication.name}</Link>
        </p>
      )}

      {data.topDocuments.length > 0 && (
        <div className="mb-6">
          <p className="typo-meta mb-2">Most read documents</p>
          <div className="divide-y divide-border surface-bordered overflow-hidden">
            {data.topDocuments.map((d) => (
              <Link key={d.id} href={d.href} className="flex items-center justify-between gap-3 px-4 py-3 typo-body-sm hover:bg-muted/40 min-h-[44px]">
                <span className="flex items-center gap-2 min-w-0">
                  <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{d.title}</span>
                </span>
                <span className="text-xs text-muted-foreground shrink-0">{formatCount(d.readerCount)} readers</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {data.readingPaths.length > 0 && (
        <div className="mb-6">
          <p className="typo-meta mb-1">Suggested reading paths</p>
          <p className="text-[11px] text-muted-foreground mb-2">From explicit Previous/Next links — not authoritative order</p>
          <div className="space-y-3">
            {data.readingPaths.map((path, i) => (
              <div key={i} className="surface-bordered p-3 flex flex-wrap gap-2 items-center">
                {path.documents.map((d, j) => (
                  <span key={d.id} className="flex items-center gap-2">
                    {j > 0 && <span className="text-muted-foreground">→</span>}
                    <Link href={d.href} className="typo-body-sm underline underline-offset-2">{d.title}</Link>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.tags.length > 0 && (
        <div className="mb-6">
          <p className="typo-meta mb-2 flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Topics in this trace</p>
          <div className="flex flex-wrap gap-2">
            {data.tags.map((t) => (
              <Link key={t.slug} href={`/explore?tag=${t.slug}`} className="text-xs border border-border rounded-full px-3 py-1 hover:bg-muted/40">
                {t.name} ({t.count})
              </Link>
            ))}
          </div>
        </div>
      )}

      {data.relatedTraces.length > 0 && (
        <div>
          <p className="typo-meta mb-2 flex items-center gap-1.5"><GitBranch className="h-3.5 w-3.5" /> Related traces</p>
          <div className="divide-y divide-border surface-bordered overflow-hidden">
            {data.relatedTraces.map((t) => (
              <Link key={t.id} href={t.href} className="flex items-center gap-2 px-4 py-3 typo-body-sm hover:bg-muted/40 min-h-[44px]">
                <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
