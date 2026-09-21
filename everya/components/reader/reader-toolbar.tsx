"use client";

import { Minus, Plus, Maximize2, Minimize2, AlignLeft, AlignJustify } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useReaderPrefs, type FontSize, type ContentWidth } from "@/hooks/use-reader-prefs";

const sizes: FontSize[] = ["sm", "base", "lg", "xl"];
const widths: { id: ContentWidth; icon: typeof AlignLeft }[] = [
  { id: "narrow", icon: AlignLeft },
  { id: "default", icon: AlignJustify },
  { id: "wide", icon: AlignJustify },
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
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-full border border-border bg-card/90 backdrop-blur px-2 py-1 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-0.5 pr-1 border-r border-border mr-1">
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => stepFont(-1)} aria-label="Smaller text">
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-8 text-center">Aa</span>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => stepFont(1)} aria-label="Larger text">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex items-center gap-0.5 pr-1 border-r border-border mr-1">
        {widths.map(({ id, icon: Icon }) => (
          <Button
            key={id}
            variant={contentWidth === id ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={() => setContentWidth(id)}
            aria-label={`${id} width`}
          >
            <Icon className={cn("h-3.5 w-3.5", id === "wide" && "scale-110")} />
          </Button>
        ))}
      </div>

      <Button
        variant={focusMode ? "secondary" : "ghost"}
        size="sm"
        className="h-7 rounded-full text-xs gap-1.5"
        onClick={toggleFocusMode}
      >
        {focusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        Focus
      </Button>
    </div>
  );
}
