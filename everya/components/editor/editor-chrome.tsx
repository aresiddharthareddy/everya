"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function EditorChrome({
  backHref,
  backLabel,
  statusLabel,
  statusVariant = "secondary",
  error,
  dirty,
  previewHref,
  primaryAction,
  primaryLabel,
  primaryLoading,
  secondaryAction,
  secondaryLabel,
  discardAction,
  discardLabel = "Discard draft",
  discardLoading,
  children,
  className,
}: {
  backHref: string;
  backLabel: string;
  statusLabel: string;
  statusVariant?: "secondary" | "success" | "warning";
  error?: string;
  dirty?: boolean;
  previewHref?: string | null;
  primaryAction: () => void;
  primaryLabel: string;
  primaryLoading?: boolean;
  secondaryAction?: () => void;
  secondaryLabel?: string;
  discardAction?: () => void;
  discardLabel?: string;
  discardLoading?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();

  const goBack = () => {
    if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) return;
    router.push(backHref);
  };

  return (
    <div className={cn("page-container py-page max-w-5xl", className)}>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <button
          type="button"
          onClick={goBack}
          className="typo-body-sm text-muted-foreground hover:text-foreground motion-fast min-h-[44px]"
        >
          ← {backLabel}
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant={
              error ? "error" : dirty ? "warning" : statusVariant === "success" ? "success" : "outline"
            }
            className="tabular-nums"
          >
            {error || statusLabel}
          </Badge>
          {previewHref && (
            <Link href={previewHref} target="_blank" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Preview
            </Link>
          )}
          {discardAction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={discardAction}
              loading={discardLoading}
              disabled={primaryLoading}
              className="text-destructive hover:text-destructive"
            >
              {discardLabel}
            </Button>
          )}
          {secondaryAction && secondaryLabel && (
            <Button variant="outline" size="sm" onClick={secondaryAction} disabled={primaryLoading || discardLoading}>
              {secondaryLabel}
            </Button>
          )}
          <Button size="sm" onClick={primaryAction} loading={primaryLoading} disabled={discardLoading}>
            {primaryLabel}
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}
