import Link from "next/link";
import { GitBranch, Link2 } from "lucide-react";
import { Surface } from "@/components/ui/surface";

export function ExploreKnowledgeHints({
  connectedTraces,
  connectedDocuments,
}: {
  connectedTraces: { id: string; name: string; href: string; documentCount: number; linkCount: number }[];
  connectedDocuments: { id: string; title: string; href: string; linkCount: number; context: string }[];
}) {
  if (!connectedTraces.length && !connectedDocuments.length) return null;

  return (
    <Surface variant="bordered" padding="md">
      <h2 className="typo-caption mb-4">Connected knowledge</h2>
      {connectedDocuments.length > 0 && (
        <div className="mb-4">
          <p className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wider">Documents with relationships</p>
          <ul className="space-y-2">
            {connectedDocuments.map((d) => (
              <li key={d.id}>
                <Link href={d.href} className="typo-body-sm hover:underline flex items-start gap-2">
                  <Link2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                  <span>
                    {d.title}
                    <span className="block typo-meta">{d.context} · {d.linkCount} links</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {connectedTraces.length > 0 && (
        <div>
          <p className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wider">Active traces</p>
          <ul className="space-y-2">
            {connectedTraces.map((t) => (
              <li key={t.id}>
                <Link href={t.href} className="typo-body-sm hover:underline flex items-start gap-2">
                  <GitBranch className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                  <span>
                    {t.name}
                    <span className="block typo-meta">{t.documentCount} docs · {t.linkCount} trace links</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Surface>
  );
}
