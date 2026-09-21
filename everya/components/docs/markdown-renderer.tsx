"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { cn } from "@/lib/utils";

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return extractText(node.props.children);
  }
  return "";
}

const CALLOUT_MAP: Record<string, string> = {
  NOTE: "callout-note",
  INFO: "callout-note",
  TIP: "callout-tip",
  WARNING: "callout-warning",
};

export function MarkdownRenderer({ content, className }: { content: string; className?: string }) {
  if (!content?.trim()) {
    return <p className="typo-body-sm text-muted-foreground italic">This document has no body yet.</p>;
  }

  return (
    <div className={cn("article-body", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeSlug]}
        components={{
          blockquote: ({ children }) => {
            const text = extractText(children).trim();
            const match = text.match(/^\[!([A-Z]+)\]\s*([\s\S]*)$/i);
            if (match) {
              const kind = match[1].toUpperCase();
              const body = match[2].trim();
              const calloutClass = CALLOUT_MAP[kind] ?? "callout-note";
              return (
                <div className={cn("callout", calloutClass)} role="note">
                  <p className="typo-caption mb-2 normal-case">{kind}</p>
                  <div>{body}</div>
                </div>
              );
            }
            return <blockquote>{children}</blockquote>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
