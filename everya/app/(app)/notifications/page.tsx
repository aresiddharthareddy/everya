import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/navigation/page-header";
import { NotificationsList } from "@/components/notifications/notifications-list";

export default async function NotificationsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    include: { actor: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const items = notifications.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    link: n.link,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
    actor: n.actor,
  }));

  return (
    <div className="page-container py-page max-w-2xl">
      <PageHeader
        eyebrow="Activity"
        title="Notifications"
        description="Follows, responses, and updates from people and publications you follow."
      />
      <NotificationsList initial={items} />
    </div>
  );
}
