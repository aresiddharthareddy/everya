"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { cn } from "@/lib/utils";

export function MarkdownRenderer({ content, className }: { content: string; className?: string }) {
  if (!content?.trim()) {
    return <p className="text-sm text-muted-foreground italic">This story has no body yet.</p>;
  }

  return (
    <div className={cn("article-body", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight, rehypeSlug]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
