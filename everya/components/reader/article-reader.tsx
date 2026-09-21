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

  const drawer = (side: "left" | "right", open: boolean, onClose: () => void, title: string, body: React.ReactNode) =>
    open && (
      <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label={title}>
        <button type="button" className="absolute inset-0 bg-background/60" aria-label="Close panel" onClick={onClose} />
        <aside
          className={cn(
            "relative h-full bg-card border-border shadow-2xl overflow-y-auto motion-normal",
            side === "right" ? "ml-auto w-80 max-w-[90vw] border-l" : "w-72 max-w-[85vw] border-r"
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="typo-nav">{title}</h3>
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4">{body}</div>
        </aside>
      </div>
    );

  return (
    <div className="relative min-h-full bg-background pb-24">
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-2">
        <ReaderToolbar className="shadow-lg" />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="shadow-sm bg-card min-h-[44px]"
            onClick={() => setTocOpen((o) => !o)}
            aria-expanded={tocOpen}
          >
            <ListTree className="h-3.5 w-3.5 mr-1.5" /> Contents
          </Button>
          {tree && (
            <Button
              variant="outline"
              size="sm"
              className="shadow-sm bg-card min-h-[44px]"
              onClick={() => setTreeOpen((o) => !o)}
              aria-expanded={treeOpen}
            >
              Trace
            </Button>
          )}
        </div>
      </div>

      {drawer("right", tocOpen, () => setTocOpen(false), "Table of contents", <TableOfContents content={content} />)}
      {drawer("left", treeOpen && !!tree, () => setTreeOpen(false), "In this trace", tree)}

      <div className={cn("mx-auto px-page py-page read-container", widthClass[contentWidth], focusMode && "max-w-3xl")}>
        {children}
      </div>
    </div>
  );
}
