import { PageHeader } from "@/components/navigation/page-header";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExploreLoading() {
  return (
    <div className="min-h-full bg-muted/15">
      <div className="page-container py-page max-w-6xl">
        <div className="grid lg:grid-cols-[1fr_300px] gap-10 lg:gap-14">
          <div>
            <PageHeader
              className="mb-8"
              eyebrow="Discover"
              title="Home"
              description="Articles, authors, and publications from across EveryA."
            />
            <div className="flex gap-2 border-b border-border pb-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-20" />
              ))}
            </div>
            <FeedSkeleton />
          </div>
          <aside className="hidden lg:block space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </aside>
        </div>
      </div>
    </div>
  );
}
