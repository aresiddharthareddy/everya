"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Search, FileText, FolderGit2, Loader2, Newspaper, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/hooks/use-ui-store";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/everya/empty-state";
import { ContentTypeBadge } from "@/components/content/content-type-badge";
import type { SearchResult } from "@/types";

const TYPE_META: Record<SearchResult["type"], { icon: typeof FileText; label: string }> = {
  document: { icon: FileText, label: "Document" },
  repository: { icon: FolderGit2, label: "Collection" },
  trace: { icon: FolderGit2, label: "Trace" },
  publication: { icon: Newspaper, label: "Publication" },
  author: { icon: User, label: "Author" },
};

export function SearchModal() {
  const { searchOpen, setSearchOpen } = useUIStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
      setActiveIndex(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 200);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (!searchOpen) return;
      if (e.key === "Escape") setSearchOpen(false);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && results[activeIndex]) {
        e.preventDefault();
        router.push(results[activeIndex].href);
        setSearchOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchOpen, setSearchOpen, results, activeIndex, router]);

  const navigate = (href: string) => {
    router.push(href);
    setSearchOpen(false);
    setQuery("");
  };

  if (!searchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal="true" aria-label="Search">
      <button type="button" className="fixed inset-0 bg-black/40" aria-label="Close search" onClick={() => setSearchOpen(false)} />
      <div className="relative w-full max-w-lg surface-elevated shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles, publications, collections, people…"
            aria-label="Search query"
            className="flex-1 h-12 bg-transparent typo-body-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2" role="listbox">
          {loading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground" role="status">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="p-4">
              <EmptyState title="No results" description={`Nothing matched "${query}". Try different keywords.`} />
            </div>
          )}
          {results.map((r, i) => {
            const meta = TYPE_META[r.type];
            const Icon = meta.icon;
            return (
              <button
                key={`${r.type}-${r.id}`}
                type="button"
                role="option"
                aria-selected={i === activeIndex}
                onClick={() => navigate(r.href)}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-3 text-left motion-fast min-h-[44px]",
                  i === activeIndex ? "bg-muted text-foreground" : "hover:bg-muted text-foreground"
                )}
              >
                <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="typo-nav truncate">{r.title}</p>
                  {r.subtitle && <p className="typo-meta truncate">{r.subtitle}</p>}
                </div>
                <ContentTypeBadge
                  type={
                    r.type === "document"
                      ? "article"
                      : r.type === "trace"
                        ? "trace"
                        : r.type === "repository"
                          ? "collection"
                          : r.type === "publication"
                            ? "publication"
                            : "author"
                  }
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
