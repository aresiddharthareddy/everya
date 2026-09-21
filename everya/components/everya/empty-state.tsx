import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Surface variant="inset" padding="lg" className="text-center">
      {icon && <div className="mb-4 flex justify-center text-muted-foreground">{icon}</div>}
      <h3 className="typo-section-title">{title}</h3>
      {description && (
        <p className="typo-body-sm text-muted-foreground mt-2 max-w-sm mx-auto">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="inline-block mt-5">
          <Button size="sm">{actionLabel}</Button>
        </Link>
      )}
    </Surface>
  );
}
