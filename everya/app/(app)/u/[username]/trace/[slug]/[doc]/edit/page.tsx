import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { EditTraceDocumentClient } from "./edit-trace-doc-client";

export default async function EditTraceDocumentPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return <EditTraceDocumentClient />;
}
