import Link from "next/link";
import { Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

export function PublicationIdentity({
  name,
  handle,
  href,
  description,
  className,
}: {
  name: string;
  handle: string;
  href?: string;
  description?: string | null;
  className?: string;
}) {
  const content = (
    <>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Newspaper className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="typo-nav truncate">{name}</p>
        <p className="typo-meta truncate">@{handle}</p>
        {description && <p className="typo-body-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>}
      </div>
    </>
  );

  const base = cn("flex items-start gap-2.5 min-w-0", className);

  if (href) {
    return (
      <Link href={href} className={cn(base, "group hover:opacity-80 motion-fast")}>
        {content}
      </Link>
    );
  }

  return <div className={base}>{content}</div>;
}
