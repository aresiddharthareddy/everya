import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

export async function notify(input: {
  userId: string;
  actorId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  if (input.actorId && input.actorId === input.userId) return;
  await prisma.notification.create({
    data: {
      userId: input.userId,
      actorId: input.actorId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
    },
  });
}
