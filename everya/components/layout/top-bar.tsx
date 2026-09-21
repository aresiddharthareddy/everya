"use client";

import { Menu } from "lucide-react";
import { useUIStore } from "@/hooks/use-ui-store";
import { Button } from "@/components/ui/button";
import { HeaderActions, HeaderSearchButton } from "@/components/navigation/header-actions";

export function TopBar() {
  const { setMobileNavOpen } = useUIStore();

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center gap-3 chrome-bar px-page">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden shrink-0"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </Button>

      <HeaderSearchButton />

      <HeaderActions />
    </header>
  );
}
