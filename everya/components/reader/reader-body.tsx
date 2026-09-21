"use client";

import { MarkdownRenderer } from "@/components/docs/markdown-renderer";
import { useReaderPrefs, fontSizeClass } from "@/hooks/use-reader-prefs";
import { cn } from "@/lib/utils";

export function ReaderBody({ content }: { content: string }) {
  const { fontSize } = useReaderPrefs();
  return <MarkdownRenderer content={content} className={cn(fontSizeClass[fontSize])} />;
}
