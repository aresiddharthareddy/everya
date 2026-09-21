"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function FollowButton({
  username,
  initialFollowing,
  signedIn,
  isSelf,
}: {
  username: string;
  initialFollowing: boolean;
  signedIn: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  if (isSelf) return null;

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
      const res = await fetch(`/api/users/${username}/follow`, { method: "POST" });
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
      aria-pressed={following}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
