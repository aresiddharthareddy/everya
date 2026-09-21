import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { EditTraceDocumentClient } from "./edit-trace-doc-client";

export default async function EditTraceDocumentPage({
  params,
}: {
  params: Promise<{ username: string; slug: string; doc: string }>;
}) {
  const { username, slug, doc } = await params;
  const session = await getServerSession();
  const next = `/u/${username}/trace/${slug}/${doc}/edit`;
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  return <EditTraceDocumentClient />;
}
