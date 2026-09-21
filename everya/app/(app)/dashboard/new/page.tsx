import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { NewRepositoryClient } from "./new-repo-client";

export default async function NewRepositoryPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/dashboard/new");
  return <NewRepositoryClient />;
}
