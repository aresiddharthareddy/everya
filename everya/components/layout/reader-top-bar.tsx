"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useUIStore } from "@/hooks/use-ui-store";
import { Button } from "@/components/ui/button";
import { AppBrand } from "@/components/navigation/app-brand";
import { HeaderActions, HeaderSearchButton } from "@/components/navigation/header-actions";
import { primaryNav } from "@/lib/navigation";

export function ReaderTopBar() {
  const pathname = usePathname();
  const { setMobileNavOpen } = useUIStore();

  const parts = pathname.split("/").filter(Boolean);
  const backHref =
    parts[0] === "p" && parts.length >= 2
      ? `/p/${parts[1]}`
      : parts[0] === "u" && parts[2] === "trace" && parts.length >= 4
        ? `/u/${parts[1]}/trace/${parts[3]}`
        : parts[0] === "r" && parts.length >= 3
          ? `/u/${parts[1]}/trace/${parts[2]}`
          : "/explore";
  const backLabel = parts[0] === "p" ? "Back to publication" : "Back to trace";
  const showBack =
    (parts[0] === "p" && parts.length >= 3) ||
    (parts[0] === "r" && parts.length >= 4) ||
    (parts[0] === "u" && parts[2] === "trace" && parts.length >= 5);

  return (
    <header className="sticky top-0 z-50 chrome-bar">
      <div className="flex h-12 items-center gap-3 px-page">
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <AppBrand className="hidden sm:inline" />

        <nav className="hidden md:flex items-center gap-1 ml-2" aria-label="Quick links">
          {primaryNav.slice(0, 3).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded-md typo-nav text-muted-foreground hover:text-foreground hover:bg-muted motion-fast min-h-[44px] flex items-center"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <HeaderSearchButton className="hidden sm:flex flex-1 max-w-xs ml-2 h-10 px-3 rounded-md border border-border bg-background typo-body-sm text-muted-foreground hover:bg-muted motion-fast" />

        <HeaderActions compact />
      </div>

      {showBack && (
        <div className="border-t border-border/60 bg-muted/30">
          <div className="px-page py-1.5">
            <Link href={backHref} className="typo-meta hover:text-foreground motion-fast">
              ← {backLabel}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
