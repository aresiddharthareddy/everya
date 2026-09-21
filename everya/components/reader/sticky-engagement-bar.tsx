"use client";

import { useEffect, useState } from "react";
import { DocActions } from "@/components/docs/doc-actions";
import { ShareButton } from "@/components/social/share-button";
import { cn } from "@/lib/utils";

export function StickyEngagementBar({
  title,
  documentId,
  initialLiked,
  initialBookmarked,
  initialRating,
  likeCount,
  signedIn,
}: {
  title: string;
  documentId: string;
  initialLiked: boolean;
  initialBookmarked: boolean;
  initialRating?: number;
  likeCount: number;
  signedIn: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const header = document.querySelector("[data-doc-header]");
      if (!header) return;
      setVisible(header.getBoundingClientRect().bottom < 64);
    };
    onScroll();
    const main = document.querySelector("main");
    main?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      main?.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur transition-transform duration-300",
        visible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="mx-auto max-w-2xl px-5 py-3 flex items-center justify-between gap-4">
        <p className="text-sm font-medium truncate hidden sm:block">{title}</p>
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <ShareButton />
          <DocActions
            documentId={documentId}
            initialLiked={initialLiked}
            initialBookmarked={initialBookmarked}
            initialRating={initialRating}
            likeCount={likeCount}
            signedIn={signedIn}
          />
        </div>
      </div>
    </div>
  );
}
