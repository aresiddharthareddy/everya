"use client";

import { useState } from "react";
import { Link2, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareButton({ url, title }: { url?: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const resolveUrl = () => {
    if (!url) return window.location.href.split("#")[0];
    if (url.startsWith("http")) return url.split("#")[0];
    return `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`.split("#")[0];
  };

  const share = async () => {
    const target = resolveUrl();
    try {
      if (navigator.share) {
        await navigator.share({ url: target, title: title || document.title });
        return;
      }
      await navigator.clipboard.writeText(target);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(target);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* ignore */
      }
    }
  };

  const nativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={share}
      aria-label={copied ? "Link copied" : "Share link"}
      className="min-h-[44px]"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : nativeShare ? (
        <Share2 className="h-3.5 w-3.5" />
      ) : (
        <Link2 className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied" : "Share"}
    </Button>
  );
}
