import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="typo-caption mb-2">{eyebrow}</p>}
        <h1 className="typo-page-title">{title}</h1>
        {description && <p className="typo-article-subtitle mt-2 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
