"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, FileText, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TreeNode } from "@/types";

function collectAncestorIds(nodes: TreeNode[], targetSlug: string, path: string[] = []): string[] | null {
  for (const node of nodes) {
    if (node.type === "document" && node.slug === targetSlug) return path;
    if (node.type === "folder" && node.children) {
      const found = collectAncestorIds(node.children, targetSlug, [...path, node.id]);
      if (found) return found;
    }
  }
  return null;
}

function TreeItem({
  node,
  basePath,
  activeSlug,
  openIds,
  toggle,
  depth = 0,
}: {
  node: TreeNode;
  basePath: string;
  activeSlug?: string;
  openIds: Set<string>;
  toggle: (id: string) => void;
  depth?: number;
}) {
  const isFolder = node.type === "folder";
  const href = isFolder ? undefined : `${basePath}/${node.slug}`;
  const isActive = !isFolder && node.slug === activeSlug;
  const isOpen = isFolder && openIds.has(node.id);
  const pad = depth * 12 + 8;

  if (isFolder) {
    return (
      <div role="treeitem" aria-expanded={isOpen}>
        <button
          type="button"
          onClick={() => toggle(node.id)}
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-2 typo-body-sm text-muted-foreground hover:bg-muted hover:text-foreground motion-fast min-h-[44px]"
          style={{ paddingLeft: pad }}
          aria-label={`${isOpen ? "Collapse" : "Expand"} ${node.name}`}
        >
          <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 motion-fast", isOpen && "rotate-90")} />
          <Folder className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate text-left">{node.name}</span>
        </button>
        {isOpen && (
          <div role="group">
            {node.children?.map((child) => (
              <TreeItem
                key={child.id}
                node={child}
                basePath={basePath}
                activeSlug={activeSlug}
                openIds={openIds}
                toggle={toggle}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={href!}
      role="treeitem"
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-2 typo-body-sm motion-fast min-h-[44px]",
        isActive ? "bg-foreground/8 text-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      style={{ paddingLeft: pad + 16 }}
    >
      <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{node.name}</span>
    </Link>
  );
}

export function KnowledgeTree({
  tree,
  basePath,
  activeSlug,
  className,
}: {
  tree: TreeNode[];
  basePath: string;
  activeSlug?: string;
  className?: string;
}) {
  const ancestorIds = useMemo(
    () => (activeSlug ? collectAncestorIds(tree, activeSlug) ?? [] : []),
    [tree, activeSlug]
  );

  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(ancestorIds));

  useEffect(() => {
    if (ancestorIds.length) {
      setOpenIds((prev) => new Set([...prev, ...ancestorIds]));
    }
  }, [ancestorIds]);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!tree.length) {
    return <p className="px-3 py-4 typo-meta">No documents in this trace yet.</p>;
  }

  return (
    <nav aria-label="Trace contents" className={cn("space-y-0.5 py-2", className)}>
      <div role="tree">
        {tree.map((node) => (
          <TreeItem
            key={node.id}
            node={node}
            basePath={basePath}
            activeSlug={activeSlug}
            openIds={openIds}
            toggle={toggle}
          />
        ))}
      </div>
    </nav>
  );
}
