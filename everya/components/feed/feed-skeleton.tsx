import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export function FeedSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-8 mt-8" aria-hidden="true">
      <div className="surface-bordered p-8 space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-3/4" />
        <SkeletonText lines={3} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="py-6 border-b border-border/70 space-y-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-7 w-2/3" />
          <SkeletonText lines={2} />
        </div>
      ))}
    </div>
  );
}
