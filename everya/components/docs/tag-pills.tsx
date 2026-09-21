import Link from "next/link";
import { cn } from "@/lib/utils";

export function TagPills({
  tags,
  activeSlug,
  className,
}: {
  tags: { name: string; slug: string; count?: number }[];
  activeSlug?: string;
  className?: string;
}) {
  if (!tags.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag) => (
        <Link
          key={tag.slug}
          href={activeSlug === tag.slug ? "/explore" : `/explore?tag=${tag.slug}`}
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition-colors",
            activeSlug === tag.slug
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
          )}
        >
          {tag.name}
          {tag.count != null && <span className="ml-1 opacity-60">{tag.count}</span>}
        </Link>
      ))}
    </div>
  );
}
