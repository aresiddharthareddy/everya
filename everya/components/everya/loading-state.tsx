import { Spinner } from "@/components/ui/spinner";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export function LoadingState({
  label = "Loading…",
  variant = "spinner",
}: {
  label?: string;
  variant?: "spinner" | "skeleton" | "inline";
}) {
  if (variant === "inline") {
    return (
      <span className="inline-flex items-center gap-2 typo-body-sm text-muted-foreground" role="status" aria-live="polite">
        <Spinner size="sm" />
        {label}
      </span>
    );
  }

  if (variant === "skeleton") {
    return (
      <div className="space-y-4 py-8" role="status" aria-live="polite" aria-label={label}>
        <Skeleton className="h-8 w-2/3" />
        <SkeletonText lines={4} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" role="status" aria-live="polite">
      <Spinner size="lg" className="mb-4" />
      <p className="typo-body-sm text-muted-foreground">{label}</p>
    </div>
  );
}
