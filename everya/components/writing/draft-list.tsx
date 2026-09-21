import Link from "next/link";
import { FileText, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type DraftListItem = {
  id: string;
  title: string;
  updatedAt: Date | string;
  editHref: string;
  contextLabel?: string;
  author?: { username: string; name: string | null };
};

export function DraftList({ drafts }: { drafts: DraftListItem[] }) {
  if (!drafts.length) {
    return <p className="typo-body-sm text-muted-foreground py-4">No drafts right now.</p>;
  }

  return (
    <div className="divide-y divide-border surface-bordered overflow-hidden">
      {drafts.map((draft) => (
        <div
          key={draft.id}
          className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap hover:bg-muted/30 motion-fast"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="typo-body-sm truncate">{draft.title}</p>
              <p className="typo-meta">
                {draft.contextLabel ? `${draft.contextLabel} · ` : ""}
                {new Date(draft.updatedAt).toLocaleString()}
                {draft.author ? ` · @${draft.author.username}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Draft</Badge>
            <Link
              href={draft.editHref}
              className="inline-flex items-center gap-1 typo-body-sm text-primary hover:underline min-h-[44px] px-2"
            >
              <Pencil className="h-3.5 w-3.5" />
              Continue
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
