import { prisma } from "@/lib/prisma";

export type AnalyticsEventType =
  | "article_view"
  | "article_completion"
  | "follow"
  | "unfollow"
  | "publication_follow"
  | "publication_unfollow"
  | "trace_follow"
  | "trace_unfollow"
  | "reaction"
  | "bookmark"
  | "comment"
  | "publication_created"
  | "article_published";

export async function trackEvent(input: {
  eventType: AnalyticsEventType;
  userId?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.analyticsEvent.create({
    data: {
      eventType: input.eventType,
      userId: input.userId,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}
