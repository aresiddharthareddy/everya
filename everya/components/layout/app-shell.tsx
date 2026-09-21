"use client";

import { usePathname } from "next/navigation";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { ReaderTopBar } from "@/components/layout/reader-top-bar";
import { SearchModal } from "@/components/search/search-modal";

function isArticleReader(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  return parts[0] === "r" && parts.length === 4 && !pathname.endsWith("/edit") && !pathname.endsWith("/new");
}

export function AppShell({
  children,
  repositories,
}: {
  children: React.ReactNode;
  repositories?: { id: string; name: string; slug: string; ownerUsername: string }[];
}) {
  const pathname = usePathname();
  const readerMode = isArticleReader(pathname);

  if (readerMode) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ReaderTopBar />
        <main className="flex-1">{children}</main>
        <SearchModal />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <LeftSidebar repositories={repositories} />
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <SearchModal />
    </div>
  );
}
