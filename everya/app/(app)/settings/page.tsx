import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/settings");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, bio: true, website: true, image: true, username: true, email: true },
  });

  return <SettingsClient user={user ?? session.user} />;
}
