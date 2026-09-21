"use client";

import { useEffect, useRef, useState } from "react";
import { DocActions } from "@/components/docs/doc-actions";
import { ShareButton } from "@/components/social/share-button";

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
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const header = document.querySelector("[data-doc-header]");
        if (header) setVisible(header.getBoundingClientRect().bottom < 64);
        ticking.current = false;
      });
    };
    onScroll();
    const main = document.querySelector("main");
    main?.addEventListener("scroll", onScroll, { passive: true });
    return () => main?.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background">
      <div className="mx-auto max-w-2xl px-page py-3 flex items-center justify-between gap-4">
        <p className="typo-body-sm font-medium truncate hidden sm:block text-foreground">{title}</p>
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
