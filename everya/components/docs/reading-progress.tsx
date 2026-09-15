"use client";

import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.querySelector("[data-article]");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.scrollHeight - window.innerHeight;
      const passed = window.scrollY - (el as HTMLElement).offsetTop;
      const next = total > 0 ? Math.min(100, Math.max(0, (passed / total) * 100)) : 0;
      setProgress(next);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.querySelector("main")?.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.querySelector("main")?.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="pointer-events-none sticky top-0 z-30 h-0.5 w-full overflow-hidden bg-transparent">
      <div className="h-full bg-foreground transition-[width] duration-150" style={{ width: `${progress}%` }} />
    </div>
  );
}
