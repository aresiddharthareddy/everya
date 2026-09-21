"use client";

import { useEffect, useState } from "react";
import { headingId, cn } from "@/lib/utils";
import type { TocItem } from "@/types";

export function TableOfContents({ content }: { content: string }) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [active, setActive] = useState("");

  useEffect(() => {
    const headings: TocItem[] = [];
    const regex = /^(#{1,3})\s+(.+)$/gm;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].replace(/[*`]/g, "");
      const id = headingId(text);
      headings.push({ id, text, level });
    }
    setItems(headings);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-80px 0px -80% 0px" }
    );
    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
        On this page
      </p>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={cn(
            "block text-sm py-0.5 transition-colors hover:text-foreground",
            item.level === 2 && "pl-0",
            item.level === 3 && "pl-3",
            active === item.id ? "text-foreground font-medium" : "text-muted-foreground"
          )}
        >
          {item.text}
        </a>
      ))}
    </nav>
  );
}
