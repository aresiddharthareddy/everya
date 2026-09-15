import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatUsername } from "@/lib/utils";

export default async function NotificationsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    include: { actor: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Notifications</h1>
      {notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notifications yet.</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.link || "#"}
              className={`block px-4 py-3 hover:bg-muted/50 transition-colors ${!n.read ? "bg-muted/30" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                  {n.actor && (
                    <p className="text-xs text-muted-foreground mt-1">
                      from {formatUsername(n.actor.username)}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
