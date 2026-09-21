import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/settings");
  return <SettingsClient user={session.user} />;
}
