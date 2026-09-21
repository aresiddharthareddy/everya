"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/everya/empty-state";
import { Surface } from "@/components/ui/surface";
import { formatUsername } from "@/lib/utils";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
  actor: { username: string } | null;
};

export function NotificationsList({ initial }: { initial: NotificationItem[] }) {
  const [items, setItems] = useState(initial);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unread = items.filter((n) => !n.read).length;

  if (items.length === 0) {
    return (
      <EmptyState
        title="No notifications yet"
        description="When someone interacts with your work or follows you, it will appear here."
        actionLabel="Explore"
        actionHref="/explore"
      />
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {unread > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Mark all read ({unread})
          </Button>
        </div>
      )}
      <Surface variant="bordered" className="divide-y divide-border overflow-hidden">
        {items.map((n) => (
          <Link
            key={n.id}
            href={n.link || "#"}
            className={`block px-4 py-4 hover:bg-muted/40 motion-fast ${!n.read ? "bg-muted/20" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="typo-nav">{n.title}</p>
                <p className="typo-body-sm text-muted-foreground mt-0.5">{n.message}</p>
                {n.actor && <p className="typo-meta mt-1">{formatUsername(n.actor.username)}</p>}
              </div>
              <time className="typo-meta shrink-0" dateTime={n.createdAt}>
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
              </time>
            </div>
          </Link>
        ))}
      </Surface>
    </div>
  );
}
