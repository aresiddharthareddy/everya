import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { NewTraceDocumentClient } from "./new-trace-doc-client";

export default async function NewTraceDocumentPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return <NewTraceDocumentClient />;
}
