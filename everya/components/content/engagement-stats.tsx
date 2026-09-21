import { Clock, Eye, Heart, MessageCircle, Star } from "lucide-react";
import { formatCount, formatRating } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Stats = {
  readerCount?: number;
  likeCount?: number;
  commentCount?: number;
  avgRating?: number;
  readingMinutes?: number;
};

function StatItem({
  icon: Icon,
  value,
  label,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  value: string | number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 typo-meta text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
      <span className={cn("tabular-nums", highlight && "text-foreground font-medium")}>{value}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function EngagementStats({
  stats,
  variant = "inline",
  className,
}: {
  stats: Stats;
  variant?: "inline" | "compact";
  className?: string;
}) {
  const items = [
    stats.readingMinutes != null && { icon: Clock, value: `${stats.readingMinutes} min`, label: "reading time" },
    stats.readerCount != null && { icon: Eye, value: formatCount(stats.readerCount), label: "views" },
    stats.likeCount != null && { icon: Heart, value: formatCount(stats.likeCount), label: "claps" },
    stats.commentCount != null && { icon: MessageCircle, value: formatCount(stats.commentCount), label: "responses" },
    stats.avgRating != null && {
      icon: Star,
      value: formatRating(stats.avgRating),
      label: "rating",
      highlight: stats.avgRating >= 4,
    },
  ].filter(Boolean) as { icon: typeof Eye; value: string; label: string; highlight?: boolean }[];

  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        variant === "inline" ? "flex flex-wrap items-center gap-x-4 gap-y-1" : "flex items-center gap-3",
        className
      )}
    >
      {items.map((item) => (
        <StatItem key={item.label} {...item} />
      ))}
    </div>
  );
}
