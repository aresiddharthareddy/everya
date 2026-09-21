"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Bell, Menu, BarChart3, PenLine } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useUIStore } from "@/hooks/use-ui-store";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { formatUsername } from "@/lib/utils";

export function TopBar() {
  const { data: session } = useSession();
  const { setSearchOpen, setMobileNavOpen } = useUIStore();
  const user = session?.user as { username?: string; name?: string; image?: string } | undefined;
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!session) return;
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.unread) setUnread(data.unread);
      })
      .catch(() => {});
  }, [session]);

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-border bg-background/95 backdrop-blur px-4">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNavOpen(true)}>
        <Menu className="h-4 w-4" />
      </Button>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex flex-1 max-w-md items-center gap-2 h-8 px-3 rounded-full border border-border bg-muted/40 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search publications…</span>
        <kbd className="hidden sm:inline text-[10px] border border-border rounded px-1 py-0.5 bg-background">⌘K</kbd>
      </button>

      <div className="flex items-center gap-1 ml-auto">
        <ThemeToggle />
        {session ? (
          <>
            <Link href="/dashboard/new" className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3 text-xs font-medium text-background hover:opacity-90">
              <PenLine className="h-3.5 w-3.5" /> Write
            </Link>
            <Link href="/stats" className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted">
              <BarChart3 className="h-4 w-4" />
            </Link>
            <Link href="/notifications" className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
              )}
            </Link>
            <Link
              href={user?.username ? `/u/${user.username}` : "/dashboard"}
              className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted transition-colors"
            >
              <Avatar src={user?.image} name={user?.name} size="sm" />
              <span className="hidden sm:inline text-sm font-medium">
                {user?.username ? formatUsername(user.username) : "Profile"}
              </span>
            </Link>
          </>
        ) : (
          <div className="flex gap-2">
            <Link href="/login" className="inline-flex h-8 items-center justify-center rounded-full px-3 text-xs font-medium hover:bg-muted">
              Sign in
            </Link>
            <Link href="/signup" className="inline-flex h-8 items-center justify-center rounded-full bg-foreground px-3 text-xs font-medium text-background hover:opacity-90">
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
