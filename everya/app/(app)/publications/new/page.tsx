import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { PageHeader } from "@/components/navigation/page-header";
import { NewPublicationClient } from "./new-publication-client";

export default async function NewPublicationPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/publications/new");

  return (
    <div className="page-container py-page max-w-lg">
      <PageHeader
        eyebrow="Create"
        title="New publication"
        description="Create a home for your articles on EveryA."
      />
      <div className="mt-8">
        <NewPublicationClient />
      </div>
    </div>
  );
}
