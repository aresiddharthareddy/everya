"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, X } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useUIStore } from "@/hooks/use-ui-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AppBrand } from "@/components/navigation/app-brand";
import { NavLink } from "@/components/navigation/nav-link";
import { isCollectionActive, isNavActive, primaryNav, secondaryNav } from "@/lib/navigation";

export function LeftSidebar({
  repositories,
  overlayOnly = false,
}: {
  repositories?: { id: string; name: string; slug: string; ownerUsername: string }[];
  overlayOnly?: boolean;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { sidebarOpen, mobileNavOpen, setMobileNavOpen } = useUIStore();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  const navItems = [
    ...primaryNav.filter((item) => !item.requiresAuth || session),
    ...secondaryNav.filter((item) => !item.requiresAuth || session),
  ];

  const content = (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-card">
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <AppBrand />
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Main">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isNavActive(pathname, item.href)}
            onClick={() => setMobileNavOpen(false)}
          />
        ))}

        {session && repositories && repositories.length > 0 && (
          <div className="pt-4">
            <div className="flex items-center justify-between px-2.5 mb-2">
              <span className="typo-caption">Collections</span>
              <Link
                href="/dashboard/new"
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted motion-fast"
                aria-label="New collection"
              >
                <Plus className="h-3.5 w-3.5" />
              </Link>
            </div>
            {repositories.map((repo) => (
              <Link
                key={repo.id}
                href={`/u/${repo.ownerUsername}/trace/${repo.slug}`}
                className={cn(
                  "block rounded-md px-2.5 py-2 typo-body-sm truncate motion-fast min-h-[44px] flex items-center",
                  isCollectionActive(pathname, repo.slug)
                    ? "bg-foreground/8 text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {repo.name}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </aside>
  );

  return (
    <>
      {!overlayOnly && (
        <div className={cn("hidden lg:block shrink-0", !sidebarOpen && "lg:hidden")}>{content}</div>
      )}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-background/80"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full">{content}</div>
        </div>
      )}
    </>
  );
}
