"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, FolderGit2, Link2, MoreHorizontal, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
export function ContentCardMenu({
  documentId,
  href,
  traceHref,
  signedIn,
  initialBookmarked,
}: {
  documentId?: string;
  href: string;
  traceHref?: string | null;
  signedIn?: boolean;
  initialBookmarked?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(initialBookmarked ?? false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const toggleBookmark = async () => {
    if (!documentId) return;
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const next = !bookmarked;
    setBookmarked(next);
    try {
      const res = await fetch(`/api/documents/${documentId}/bookmark`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBookmarked(data.bookmarked);
    } catch {
      setBookmarked(!next);
    }
  };

  const copyLink = async () => {
    const url = new URL(href, window.location.origin).href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setOpen(false);
  };

  const hasActions = traceHref || documentId;

  if (!hasActions) return null;

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="More actions"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full z-20 mt-1 min-w-[11rem] surface-bordered bg-card py-1 shadow-lg"
          role="menu"
        >
          {traceHref && (
            <Link
              href={traceHref}
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 typo-body-sm hover:bg-muted motion-fast min-h-[44px]"
              onClick={() => setOpen(false)}
            >
              <FolderGit2 className="h-4 w-4" /> Go to Trace
            </Link>
          )}
          {documentId && (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 typo-body-sm hover:bg-muted motion-fast min-h-[44px]"
              onClick={toggleBookmark}
            >
              <Bookmark className="h-4 w-4" />
              {bookmarked ? "Saved" : "Save to library"}
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 typo-body-sm hover:bg-muted motion-fast min-h-[44px]"
            onClick={copyLink}
          >
            {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  );
}
