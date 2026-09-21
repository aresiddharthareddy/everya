"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none border-0 bg-transparent p-0 backdrop:bg-background/80",
        className
      )}
      onClose={() => onOpenChange(false)}
      onClick={(e) => {
        if (e.target === ref.current) onOpenChange(false);
      }}
    >
      <div
        className="flex min-h-full items-start justify-center pt-[12vh] px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          role="document"
          className="relative w-full max-w-lg surface-elevated shadow-2xl overflow-hidden"
          aria-labelledby="dialog-title"
          aria-describedby={description ? "dialog-description" : undefined}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div>
              <h2 id="dialog-title" className="typo-section-title">{title}</h2>
              {description && (
                <p id="dialog-description" className="typo-meta mt-1">{description}</p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Close dialog"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </dialog>
  );
}
