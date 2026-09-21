"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, PenLine, BarChart3, Menu } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useUIStore } from "@/hooks/use-ui-store";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
export function ReaderTopBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { setSearchOpen, setMobileNavOpen } = useUIStore();
  const user = session?.user as { username?: string; name?: string; image?: string } | undefined;

  const parts = pathname.split("/").filter(Boolean);
  const backHref =
    parts[0] === "p" && parts.length >= 2
      ? `/p/${parts[1]}`
      : parts.length >= 3
        ? `/r/${parts[1]}/${parts[2]}`
        : "/explore";
  const showBack =
    (parts[0] === "p" && parts.length >= 3) || (parts[0] === "r" && parts.length >= 4);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setMobileNavOpen(true)}>
          <Menu className="h-4 w-4" />
        </Button>

        <Link href="/" className="font-semibold tracking-[0.2em] text-[11px] shrink-0">
          EVERYA
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link href="/explore" className="px-3 py-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            Explore
          </Link>
          <Link href="/reading-list" className="px-3 py-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            Library
          </Link>
          {session && (
            <Link href="/stats" className="px-3 py-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              Stats
            </Link>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="hidden sm:flex flex-1 max-w-xs items-center gap-2 h-9 px-4 rounded-full bg-muted/60 text-sm text-muted-foreground hover:bg-muted transition-colors ml-2"
        >
          <Search className="h-3.5 w-3.5" />
          Search
        </button>

        <div className="flex items-center gap-1 ml-auto shrink-0">
          <ThemeToggle />
          {session ? (
            <>
              <Link href="/dashboard/new" className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-xs font-medium text-background hover:opacity-90">
                <PenLine className="h-3.5 w-3.5" /> Write
              </Link>
              <Link href="/stats" className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted">
                <BarChart3 className="h-4 w-4" />
              </Link>
              <Link href="/notifications" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted">
                <Bell className="h-4 w-4" />
              </Link>
              <Link href={user?.username ? `/u/${user.username}` : "/dashboard"} className="ml-1">
                <Avatar src={user?.image} name={user?.name} size="sm" />
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm px-3 py-1.5 hover:bg-muted rounded-full">Sign in</Link>
              <Link href="/signup" className="text-sm px-4 py-1.5 rounded-full bg-foreground text-background font-medium hover:opacity-90">
                Start reading
              </Link>
            </>
          )}
        </div>
      </div>
      {showBack && (
        <div className="border-t border-border/40 bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-1.5">
            <Link href={backHref} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← {parts[0] === "p" ? "Back to publication" : "Back to collection"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
