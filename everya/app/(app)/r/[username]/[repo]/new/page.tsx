import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { NewDocumentClient } from "./new-doc-client";

export default async function NewDocumentPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return <NewDocumentClient />;
}
