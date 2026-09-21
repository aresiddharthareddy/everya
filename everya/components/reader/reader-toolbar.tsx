"use client";

import { Minus, Plus, Maximize2, Minimize2, AlignLeft, AlignJustify } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useReaderPrefs, type FontSize, type ContentWidth } from "@/hooks/use-reader-prefs";

const sizes: FontSize[] = ["sm", "base", "lg", "xl"];
const widths: { id: ContentWidth; icon: typeof AlignLeft; label: string }[] = [
  { id: "narrow", icon: AlignLeft, label: "Narrow reading width" },
  { id: "default", icon: AlignJustify, label: "Default reading width" },
  { id: "wide", icon: AlignJustify, label: "Wide reading width" },
];

export function ReaderToolbar({ className }: { className?: string }) {
  const { fontSize, contentWidth, focusMode, setFontSize, setContentWidth, toggleFocusMode } =
    useReaderPrefs();

  const stepFont = (dir: -1 | 1) => {
    const i = sizes.indexOf(fontSize);
    const next = sizes[Math.min(sizes.length - 1, Math.max(0, i + dir))];
    setFontSize(next);
  };

  return (
    <div
      role="toolbar"
      aria-label="Reading preferences"
      className={cn(
        "flex flex-wrap items-center gap-1 surface-bordered bg-card px-2 py-1.5 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-0.5 pr-2 border-r border-border mr-1">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => stepFont(-1)} aria-label="Smaller text">
          <Minus className="h-4 w-4" />
        </Button>
        <span className="typo-caption w-8 text-center" aria-hidden="true">Aa</span>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => stepFont(1)} aria-label="Larger text">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-0.5 pr-2 border-r border-border mr-1">
        {widths.map(({ id, icon: Icon, label }) => (
          <Button
            key={id}
            variant={contentWidth === id ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9"
            onClick={() => setContentWidth(id)}
            aria-label={label}
            aria-pressed={contentWidth === id}
          >
            <Icon className={cn("h-4 w-4", id === "wide" && "scale-110")} />
          </Button>
        ))}
      </div>

      <Button
        variant={focusMode ? "secondary" : "ghost"}
        size="sm"
        className="h-9 gap-1.5"
        onClick={toggleFocusMode}
        aria-pressed={focusMode}
      >
        {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        Focus
      </Button>
    </div>
  );
}
