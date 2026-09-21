"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Bell, PenLine, BarChart3 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useUIStore } from "@/hooks/use-ui-store";
import { buttonVariants } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { formatUsername } from "@/lib/utils";

export function HeaderSearchButton({ className }: { className?: string }) {
  const { setSearchOpen } = useUIStore();
  return (
    <button
      type="button"
      onClick={() => setSearchOpen(true)}
      aria-label="Search"
      className={
        className ??
        "flex flex-1 max-w-md items-center gap-2 h-10 px-3 rounded-md border border-border bg-background typo-body-sm text-muted-foreground hover:bg-muted motion-fast"
      }
    >
      <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="flex-1 text-left truncate">Search articles, publications…</span>
      <kbd className="hidden sm:inline text-[10px] border border-border rounded px-1 py-0.5 bg-background">⌘K</kbd>
    </button>
  );
}

export function HeaderActions({ compact }: { compact?: boolean }) {
  const { data: session } = useSession();
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
    <div className="flex items-center gap-1 ml-auto shrink-0">
      <ThemeToggle />
      {session ? (
        <>
          <Link href="/create" className={buttonVariants({ size: "sm", className: "hidden sm:inline-flex" })}>
            <PenLine className="h-3.5 w-3.5" /> Create
          </Link>
          {!compact && (
            <Link
              href="/stats"
              aria-label="Stats"
              className={buttonVariants({ variant: "ghost", size: "icon-sm", className: "hidden md:inline-flex" })}
            >
              <BarChart3 className="h-4 w-4" />
            </Link>
          )}
          <Link
            href="/notifications"
            aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
            className={buttonVariants({ variant: "ghost", size: "icon-sm", className: "relative" })}
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" aria-hidden="true" />
            )}
          </Link>
          <Link
            href={user?.username ? `/u/${user.username}` : "/dashboard"}
            className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted motion-fast min-h-[44px]"
            aria-label="Your profile"
          >
            <Avatar src={user?.image} name={user?.name} size="sm" />
            {!compact && (
              <span className="hidden sm:inline typo-nav">
                {user?.username ? formatUsername(user.username) : "Profile"}
              </span>
            )}
          </Link>
        </>
      ) : (
        <div className="flex gap-2">
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>Sign in</Link>
          <Link href="/signup" className={buttonVariants({ size: "sm" })}>Get started</Link>
        </div>
      )}
    </div>
  );
}
