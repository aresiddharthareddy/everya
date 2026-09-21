import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
  className,
}: {
  href: string;
  label: string;
  icon?: LucideIcon;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-2.5 py-2 typo-nav min-h-[44px] motion-fast transition-colors",
        active
          ? "bg-foreground/8 text-foreground font-semibold"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
      aria-current={active ? "page" : undefined}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
      {label}
    </Link>
  );
}
