"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PublicationFollowButton({
  handle,
  initialFollowing,
  signedIn,
}: {
  handle: string;
  initialFollowing: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (busy) return;
    setBusy(true);
    const next = !following;
    setFollowing(next);
    try {
      const res = await fetch(`/api/publications/${handle}/follow`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFollowing(data.following);
    } catch {
      setFollowing(!next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size="sm"
      variant={following ? "outline" : "default"}
      onClick={toggle}
      disabled={busy}
    >
      {following ? "Following" : "Follow publication"}
    </Button>
  );
}
