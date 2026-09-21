"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Bookmark, BarChart3, LayoutDashboard, Plus, Settings, X } from "lucide-react";
import { useUIStore } from "@/hooks/use-ui-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/explore", label: "Explore", icon: BookOpen },
  { href: "/reading-list", label: "Library", icon: Bookmark },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function LeftSidebar({ repositories }: { repositories?: { id: string; name: string; slug: string; ownerUsername: string }[] }) {
  const pathname = usePathname();
  const { sidebarOpen, mobileNavOpen, setMobileNavOpen } = useUIStore();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  const content = (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-card">
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <Link href="/" className="font-semibold tracking-[0.16em] text-xs">
          EVERYA
        </Link>
        <Button variant="ghost" size="icon" className="lg:hidden h-7 w-7" onClick={() => setMobileNavOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                active ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {repositories && repositories.length > 0 && (
          <div className="pt-4">
            <div className="flex items-center justify-between px-2.5 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Collections</span>
              <Link href="/dashboard/new" className="text-muted-foreground hover:text-foreground">
                <Plus className="h-3.5 w-3.5" />
              </Link>
            </div>
            {repositories.map((repo) => (
              <Link
                key={repo.id}
                href={`/r/${repo.ownerUsername}/${repo.slug}`}
                className={cn(
                  "block rounded-md px-2.5 py-1.5 text-sm truncate transition-colors",
                  pathname.includes(`/${repo.slug}`)
                    ? "bg-muted text-foreground font-medium"
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
      <div className={cn("hidden lg:block shrink-0", !sidebarOpen && "lg:hidden")}>{content}</div>
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute left-0 top-0 h-full">{content}</div>
        </div>
      )}
    </>
  );
}
