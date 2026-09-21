import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { NewTraceDocumentClient } from "./new-trace-doc-client";

export default async function NewTraceDocumentPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;
  const session = await getServerSession();
  const next = `/u/${username}/trace/${slug}/new`;
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  return <NewTraceDocumentClient />;
}
