"use client";

import { useState } from "react";
import { ListTree, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReaderPrefs, widthClass } from "@/hooks/use-reader-prefs";
import { ReaderToolbar } from "@/components/reader/reader-toolbar";
import { TableOfContents } from "@/components/docs/table-of-contents";
import { Button } from "@/components/ui/button";

export function ArticleReader({
  children,
  content,
  tree,
}: {
  children: React.ReactNode;
  content: string;
  tree?: React.ReactNode;
}) {
  const { focusMode, contentWidth } = useReaderPrefs();
  const [tocOpen, setTocOpen] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);

  return (
    <div className="relative min-h-full bg-background">
      {/* floating controls */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        <ReaderToolbar className="shadow-lg" />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full shadow-md bg-card/95 backdrop-blur h-9"
            onClick={() => setTocOpen((o) => !o)}
          >
            <ListTree className="h-3.5 w-3.5 mr-1.5" /> Contents
          </Button>
          {tree && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full shadow-md bg-card/95 backdrop-blur h-9"
              onClick={() => setTreeOpen((o) => !o)}
            >
              Collection
            </Button>
          )}
        </div>
      </div>

      {/* TOC drawer */}
      {tocOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setTocOpen(false)} />
          <aside className="relative w-80 max-w-[90vw] h-full bg-card border-l border-border shadow-2xl overflow-y-auto p-6 animate-in slide-in-from-right">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium">Table of contents</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTocOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <TableOfContents content={content} />
          </aside>
        </div>
      )}

      {/* Collection tree drawer */}
      {treeOpen && tree && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setTreeOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] h-full bg-card border-r border-border shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-medium">In this collection</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTreeOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {tree}
          </aside>
        </div>
      )}

      <div className={cn("mx-auto px-5 sm:px-8 py-8 sm:py-14", widthClass[contentWidth], focusMode && "max-w-3xl")}>
        {children}
      </div>
    </div>
  );
}
