import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <h3 className="font-medium">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="inline-block mt-5">
          <Button size="sm" className="rounded-full">{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}
