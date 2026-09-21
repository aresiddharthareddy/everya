import { cn } from "@/lib/utils";

export function ContentMeta({
  items,
  className,
  separator = "·",
}: {
  items: (string | null | undefined)[];
  className?: string;
  separator?: string;
}) {
  const filtered = items.filter(Boolean) as string[];
  if (filtered.length === 0) return null;

  return (
    <p className={cn("typo-meta flex flex-wrap items-center gap-x-2 gap-y-0.5", className)}>
      {filtered.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-2">
          {i > 0 && <span aria-hidden="true">{separator}</span>}
          <span>{item}</span>
        </span>
      ))}
    </p>
  );
}
