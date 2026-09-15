import { Star, Users, Clock, Heart } from "lucide-react";
import { formatCount, formatRating } from "@/lib/utils";
import type { DocStats } from "@/types";

export function DocStatsHeader({ stats }: { stats: DocStats }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        <span className="font-medium text-foreground">{formatRating(stats.avgRating)}</span>
        <span className="text-xs">({stats.ratingCount})</span>
      </span>
      <span className="flex items-center gap-1.5">
        <Heart className="h-3.5 w-3.5" />
        {formatCount(stats.likeCount)}
      </span>
      <span className="flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5" />
        {formatCount(stats.readerCount)} readers
      </span>
      <span className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        {stats.readingMinutes} min read
      </span>
    </div>
  );
}
