import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { PageHeader } from "@/components/navigation/page-header";
import { ImportTraceClient } from "./import-trace-client";

export default async function ImportTracePage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/create/import-trace");

  return (
    <div className="page-container py-page max-w-xl">
      <PageHeader
        eyebrow="Create"
        title="Import trace"
        description="Upload a Markdown folder or Obsidian vault. Folder hierarchy becomes your trace structure."
      />
      <div className="mt-8">
        <ImportTraceClient />
      </div>
    </div>
  );
}
