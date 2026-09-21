"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type TabItem = {
  id: string;
  label: string;
  href?: string;
  disabled?: boolean;
};

export function TabsNav({
  items,
  activeId,
  onSelect,
  className,
  ariaLabel = "Tabs",
}: {
  items: TabItem[];
  activeId: string;
  onSelect?: (id: string) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <nav className={cn("flex gap-0.5 border-b border-border", className)} aria-label={ariaLabel}>
      {items.map((tab) => {
        const active = activeId === tab.id;
        const base = cn(
          "px-4 py-2.5 typo-nav border-b-2 -mb-px motion-fast transition-colors min-h-[44px] flex items-center",
          active
            ? "border-foreground text-foreground font-semibold"
            : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
        );

        if (tab.href) {
          return (
            <Link key={tab.id} href={tab.href} className={base} aria-current={active ? "page" : undefined}>
              {tab.label}
            </Link>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            className={cn(base, tab.disabled && "opacity-50 pointer-events-none")}
            aria-selected={active}
            role="tab"
            onClick={() => onSelect?.(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
