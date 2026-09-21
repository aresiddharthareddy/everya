"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Heart, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DocActions({
  documentId,
  initialLiked,
  initialBookmarked,
  initialRating,
  likeCount,
  signedIn,
}: {
  documentId: string;
  initialLiked: boolean;
  initialBookmarked: boolean;
  initialRating?: number;
  likeCount?: number;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(likeCount ?? 0);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [rating, setRating] = useState(initialRating || 0);
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);

  const requireAuth = () => {
    router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
  };

  const toggleLike = async () => {
    if (!signedIn) return requireAuth();
    if (busy) return;
    setBusy(true);
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    try {
      const res = await fetch(`/api/documents/${documentId}/like`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLiked(data.liked);
    } catch {
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
    } finally {
      setBusy(false);
    }
  };

  const toggleBookmark = async () => {
    if (!signedIn) return requireAuth();
    const next = !bookmarked;
    setBookmarked(next);
    try {
      const res = await fetch(`/api/documents/${documentId}/bookmark`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBookmarked(data.bookmarked);
    } catch {
      setBookmarked(!next);
    }
  };

  const rate = async (value: number) => {
    if (!signedIn) return requireAuth();
    const prev = rating;
    setRating(value);
    const res = await fetch(`/api/documents/${documentId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (!res.ok) setRating(prev);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-0.5 mr-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`Rate ${n} stars`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => rate(n)}
            className="p-0.5"
          >
            <Star
              className={cn(
                "h-4 w-4 transition-colors",
                (hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
              )}
            />
          </button>
        ))}
      </div>
      <Button variant={liked ? "secondary" : "outline"} size="sm" onClick={toggleLike} className="rounded-full">
        <Heart className={cn("h-3.5 w-3.5", liked && "fill-current")} />
        {likes > 0 ? likes : "Like"}
      </Button>
      <Button variant={bookmarked ? "secondary" : "outline"} size="sm" onClick={toggleBookmark} className="rounded-full">
        <Bookmark className={cn("h-3.5 w-3.5", bookmarked && "fill-current")} />
        {bookmarked ? "Saved" : "Save"}
      </Button>
    </div>
  );
}
