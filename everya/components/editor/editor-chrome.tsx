import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function EditorChrome({
  backHref,
  backLabel,
  statusLabel,
  statusVariant = "secondary",
  error,
  previewHref,
  primaryAction,
  primaryLabel,
  primaryLoading,
  children,
  className,
}: {
  backHref: string;
  backLabel: string;
  statusLabel: string;
  statusVariant?: "secondary" | "success" | "warning";
  error?: string;
  previewHref?: string | null;
  primaryAction: () => void;
  primaryLabel: string;
  primaryLoading?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("page-container py-page max-w-5xl", className)}>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <Link href={backHref} className="typo-body-sm text-muted-foreground hover:text-foreground motion-fast">
          ← {backLabel}
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={error ? "error" : statusVariant === "success" ? "success" : "outline"} className="tabular-nums">
            {error || statusLabel}
          </Badge>
          {previewHref && (
            <Link href={previewHref} target="_blank" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Preview
            </Link>
          )}
          <Button size="sm" onClick={primaryAction} loading={primaryLoading}>
            {primaryLabel}
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}
