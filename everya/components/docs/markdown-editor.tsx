"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: (value: string) => void;
  className?: string;
  minHeight?: number;
}

export function MarkdownEditor({ value, onChange, onSave, className, minHeight = 420 }: MarkdownEditorProps) {
  const { resolvedTheme } = useTheme();

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file?.type.startsWith("image/")) return;

      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) return;
      const { url } = await res.json();
      onChange(`${value}\n\n![${file.name}](${url})\n`);
    },
    [value, onChange]
  );

  return (
    <div
      className={cn("rounded-lg border border-border overflow-hidden", className)}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}
    >
      <MDEditor
        value={value}
        onChange={(v) => onChange(v || "")}
        height={minHeight}
        preview="live"
        visibleDragbar={false}
        extraCommands={[]}
      />
      {onSave && (
        <div className="border-t border-border px-3 py-2 flex justify-end bg-muted/30">
          <button
            type="button"
            onClick={() => onSave(value)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground min-h-[44px] px-2"
          >
            Save now
          </button>
        </div>
      )}
    </div>
  );
}
