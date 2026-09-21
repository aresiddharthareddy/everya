"use client";

import { cn } from "@/lib/utils";
import { useReaderPrefs, widthClass } from "@/hooks/use-reader-prefs";
import { ReaderToolbar } from "@/components/reader/reader-toolbar";

export function DocReaderLayout({
  children,
  tree,
  sidebar,
}: {
  children: React.ReactNode;
  tree: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  const { focusMode, contentWidth } = useReaderPrefs();

  return (
    <div className="flex min-h-full">
      {!focusMode && (
        <div className="w-56 shrink-0 border-r border-border hidden lg:block">{tree}</div>
      )}
      <div className="flex flex-1 min-w-0 relative">
        <div className="flex-1 min-w-0">
          <div className="sticky top-0 z-20 flex justify-center py-2 px-4 bg-background/80 backdrop-blur border-b border-border/50">
            <ReaderToolbar />
          </div>
          <div className={cn("mx-auto px-5 sm:px-8 py-10", widthClass[contentWidth])}>
            {children}
          </div>
        </div>
        {!focusMode && sidebar}
      </div>
    </div>
  );
}
