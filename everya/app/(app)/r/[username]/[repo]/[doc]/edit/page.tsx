import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { EditDocumentClient } from "./edit-client";

export default async function EditDocumentPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return <EditDocumentClient />;
}
