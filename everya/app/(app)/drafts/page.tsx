import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { listEditableDrafts } from "@/services/drafts";
import { PageHeader } from "@/components/navigation/page-header";
import { DraftList } from "@/components/writing/draft-list";
import { buttonVariants } from "@/components/ui/button";

export default async function DraftsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/drafts");

  const drafts = await listEditableDrafts(session.user.id);

  return (
    <div className="min-h-full bg-muted/15">
      <div className="page-container py-page max-w-3xl">
        <PageHeader
          eyebrow="Writing"
          title="Drafts"
          description="Unpublished documents across your traces and publications."
          actions={
            <Link href="/create" className={buttonVariants({ size: "sm", variant: "outline" })}>
              New trace
            </Link>
          }
        />
        <section className="mt-8">
          <DraftList drafts={drafts} />
        </section>
      </div>
    </div>
  );
}
