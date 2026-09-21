import { Eye, Heart, MessageCircle, Star, Clock } from "lucide-react";
import { formatCount, formatRating } from "@/lib/utils";
import type { DocStats } from "@/types";

export function DocStatsBar({ stats, commentCount }: { stats: DocStats; commentCount?: number }) {
  const items = [
    { icon: Eye, label: formatCount(stats.readerCount), sub: "views" },
    { icon: Heart, label: formatCount(stats.likeCount), sub: "claps" },
    { icon: MessageCircle, label: formatCount(commentCount ?? 0), sub: "responses" },
    {
      icon: Star,
      label: formatRating(stats.avgRating),
      sub: stats.ratingCount ? `${stats.ratingCount} ratings` : "unrated",
      highlight: stats.avgRating >= 4,
    },
    { icon: Clock, label: `${stats.readingMinutes}`, sub: "min read" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {items.map(({ icon: Icon, label, sub, highlight }) => (
        <div
          key={sub}
          className="stat-card flex flex-col items-center justify-center text-center px-3 py-4"
        >
          <Icon className="h-4 w-4 text-muted-foreground mb-2" strokeWidth={1.75} />
          <span className={highlight ? "text-lg font-semibold tabular-nums" : "text-lg font-semibold tabular-nums"}>
            {label}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">{sub}</span>
        </div>
      ))}
    </div>
  );
}

export function DocStatsInline({ stats, commentCount }: { stats: DocStats; commentCount?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span>{formatCount(stats.readerCount)} views</span>
      <span>{formatCount(stats.likeCount)} claps</span>
      <span>{commentCount ?? 0} responses</span>
      <span>{formatRating(stats.avgRating)} ★</span>
      <span>{stats.readingMinutes} min</span>
    </div>
  );
}
