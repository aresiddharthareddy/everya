import Link from "next/link";
import { BookOpen, GitBranch, Layers, Link2 } from "lucide-react";
import type { DocRefView } from "@/services/knowledge";
import { formatCount } from "@/lib/utils";

type PublicationKnowledge = {
  publication: { name: string; href: string; description?: string | null };
  trace: { name: string; href: string };
  documentCount: number;
  relationshipCount: number;
  linkedTraceCount: number;
  topDocuments: (DocRefView & { readerCount: number; readingMinutes: number })[];
  readingPaths: { documents: DocRefView[] }[];
  relatedTraces: { id: string; name: string; href: string }[];
};

export function PublicationKnowledgePanel({ data }: { data: PublicationKnowledge }) {
  if (!data.documentCount && !data.relationshipCount) return null;

  return (
    <section className="mt-12 pt-8 border-t border-border" aria-label="Publication knowledge">
      <h2 className="typo-caption mb-4">Knowledge</h2>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Articles", value: data.documentCount },
          { label: "Relationships", value: data.relationshipCount },
          { label: "Linked traces", value: data.linkedTraceCount },
        ].map(({ label, value }) => (
          <div key={label} className="stat-card p-4">
            <p className="text-2xl font-semibold tabular-nums">{formatCount(value)}</p>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      <Link
        href={data.trace.href}
        className="flex items-center gap-2 px-4 py-3 typo-body-sm surface-bordered hover:bg-muted/40 motion-fast min-h-[44px] mb-6"
      >
        <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
        Trace: {data.trace.name}
      </Link>

      {data.topDocuments.length > 0 && (
        <div className="mb-6">
          <p className="typo-meta mb-2">Key articles</p>
          <div className="divide-y divide-border surface-bordered overflow-hidden">
            {data.topDocuments.map((d) => (
              <Link key={d.id} href={d.href} className="flex items-center gap-2 px-4 py-3 typo-body-sm hover:bg-muted/40 min-h-[44px]">
                <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                {d.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {data.readingPaths.length > 0 && (
        <div className="mb-6">
          <p className="typo-meta mb-1">Reading paths</p>
          <p className="text-[11px] text-muted-foreground mb-2">Explicit Previous/Next links</p>
          {data.readingPaths.map((path, i) => (
            <div key={i} className="surface-bordered p-3 mb-2 flex flex-wrap gap-2">
              {path.documents.map((d, j) => (
                <span key={d.id} className="flex items-center gap-2">
                  {j > 0 && <span className="text-muted-foreground">→</span>}
                  <Link href={d.href} className="typo-body-sm underline">{d.title}</Link>
                </span>
              ))}
            </div>
          ))}
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
