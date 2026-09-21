import Link from "next/link";
import { ArrowLeft, ArrowRight, FolderGit2 } from "lucide-react";
import type { DocNavItem } from "@/lib/document-nav";

export function DocumentNavFooter({
  previous,
  next,
  traceHref,
  traceName,
}: {
  previous: DocNavItem | null;
  next: DocNavItem | null;
  traceHref?: string;
  traceName?: string;
}) {
  if (!previous && !next && !traceHref) return null;

  return (
    <nav className="mt-12 pt-8 border-t border-border" aria-label="Document navigation">
      {traceHref && traceName && (
        <Link
          href={traceHref}
          className="inline-flex items-center gap-1.5 typo-meta text-muted-foreground hover:text-foreground mb-6 min-h-[44px]"
        >
          <FolderGit2 className="h-3.5 w-3.5" aria-hidden="true" />
          Back to {traceName}
        </Link>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {previous ? (
          <Link
            href={previous.href}
            className="surface-bordered p-4 hover:bg-muted/40 motion-fast min-h-[44px] flex flex-col gap-1"
          >
            <span className="typo-caption flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Previous
            </span>
            <span className="typo-body-sm font-medium">{previous.title}</span>
          </Link>
        ) : (
          <div />
        )}
        {next && (
          <Link
            href={next.href}
            className="surface-bordered p-4 hover:bg-muted/40 motion-fast min-h-[44px] flex flex-col gap-1 sm:text-right"
          >
            <span className="typo-caption flex items-center gap-1 sm:justify-end">
              Next <ArrowRight className="h-3 w-3" />
            </span>
            <span className="typo-body-sm font-medium">{next.title}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
