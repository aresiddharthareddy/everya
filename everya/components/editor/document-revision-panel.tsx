"use client";

import { useCallback, useEffect, useState } from "react";
import { History, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Revision = {
  id: string;
  revisionNumber: number;
  title: string;
  status: string;
  createdAt: string;
  createdBy: { username: string; name: string | null };
};

export function DocumentRevisionPanel({
  documentId,
  onRestore,
}: {
  documentId: string;
  onRestore: (doc: { title: string; content: string; status: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/documents/${documentId}/revisions`);
    if (!res.ok) {
      setError("Could not load version history");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setRevisions(data.revisions ?? []);
    setLoading(false);
  }, [documentId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const restore = async (revisionId: string) => {
    if (!window.confirm("Restore this version? Your current content will be saved to history first.")) {
      return;
    }
    setRestoring(revisionId);
    setError(null);
    const res = await fetch(`/api/documents/${documentId}/revisions/${revisionId}/restore`, {
      method: "POST",
    });
    if (!res.ok) {
      setError("Could not restore version");
      setRestoring(null);
      return;
    }
    const doc = await res.json();
    onRestore({ title: doc.title, content: doc.content, status: doc.status });
    await load();
    setRestoring(null);
  };

  return (
    <section className="mt-10 pt-8 border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 typo-body-sm text-muted-foreground hover:text-foreground motion-fast min-h-[44px]"
      >
        <History className="h-4 w-4" />
        Version history
        {revisions.length > 0 && open && (
          <span className="typo-meta">({revisions.length})</span>
        )}
      </button>

      {open && (
        <div className="mt-4 surface-bordered divide-y divide-border">
          {loading && <p className="px-4 py-3 typo-body-sm text-muted-foreground">Loading…</p>}
          {error && <p className="px-4 py-3 typo-body-sm text-destructive">{error}</p>}
          {!loading && !error && revisions.length === 0 && (
            <p className="px-4 py-3 typo-body-sm text-muted-foreground">
              No saved versions yet. Versions are created when you save changes.
            </p>
          )}
          {revisions.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
              <div className="min-w-0">
                <p className="typo-body-sm truncate">
                  v{r.revisionNumber} · {r.title}
                </p>
                <p className="typo-meta">
                  {new Date(r.createdAt).toLocaleString()} · @{r.createdBy.username}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => restore(r.id)}
                loading={restoring === r.id}
                disabled={!!restoring}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Restore
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
