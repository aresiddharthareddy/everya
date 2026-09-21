"use client";

import { useEffect, useState } from "react";

function getScrollParent(): Element | Window {
  const main = document.querySelector("main");
  if (main && main.scrollHeight > main.clientHeight) return main;
  return window;
}

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const article = document.querySelector("[data-article]") as HTMLElement | null;
    if (!article) return;

    const onScroll = () => {
      const scrollParent = getScrollParent();
      const articleTop =
        scrollParent === window
          ? article.offsetTop
          : article.offsetTop - (scrollParent as HTMLElement).offsetTop;
      const scrollTop =
        scrollParent === window ? window.scrollY : (scrollParent as HTMLElement).scrollTop;
      const total = article.scrollHeight - (scrollParent === window ? window.innerHeight : (scrollParent as HTMLElement).clientHeight);
      const passed = scrollTop - articleTop;
      setProgress(total > 0 ? Math.min(100, Math.max(0, (passed / total) * 100)) : 0);
    };

    onScroll();
    const scrollParent = getScrollParent();
    scrollParent.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      scrollParent.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="pointer-events-none sticky top-0 z-30 h-0.5 w-full overflow-hidden bg-transparent" aria-hidden="true">
      <div className="h-full bg-foreground transition-[width] duration-150" style={{ width: `${progress}%` }} />
    </div>
  );
}
