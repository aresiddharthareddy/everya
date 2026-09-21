import { Badge } from "@/components/ui/badge";
import type { ContentAccessLevel } from "@prisma/client";

const labels: Record<ContentAccessLevel, string> = {
  PUBLIC: "Public",
  MEMBERS: "Members",
  PREMIUM: "Premium",
};

export function AccessBadge({ level }: { level: ContentAccessLevel }) {
  if (level === "PUBLIC") return null;
  const variant = level === "PREMIUM" ? "default" : "secondary";
  return <Badge variant={variant}>{labels[level]}</Badge>;
}
