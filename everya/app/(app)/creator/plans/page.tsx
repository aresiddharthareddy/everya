import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { listCreatorPlans } from "@/services/memberships";
import { PlanCreateForm } from "@/components/creator/plan-create-form";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/navigation/page-header";

export default async function CreatorPlansPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/creator/plans");

  const [plans, publications, traces] = await Promise.all([
    listCreatorPlans(session.user.id),
    prisma.publication.findMany({
      where: { ownerId: session.user.id },
      select: { id: true, name: true, handle: true },
    }),
    prisma.repository.findMany({
      where: { ownerId: session.user.id, publication: null },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const scopes = [
    ...publications.map((p) => ({ publicationId: p.id, label: `Publication: ${p.name}` })),
    ...traces.map((t) => ({ repositoryId: t.id, label: `Trace: ${t.name}` })),
  ];

  return (
    <div className="page-container py-page max-w-3xl space-y-8">
      <Link href="/creator" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Creator dashboard
      </Link>
      <PageHeader eyebrow="Creator economy" title="Membership plans" description="Manage audience access tiers for your publications and traces." />
      <PlanCreateForm scopes={scopes} />
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your plans</h2>
        {plans.map((plan) => (
          <div key={plan.id} className="stat-card p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{plan.name}</p>
              <p className="text-xs text-muted-foreground">
                {plan.publication?.name || plan.repository?.name} · ${(plan.priceCents / 100).toFixed(2)}/{plan.interval}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant={plan.tier === "PREMIUM" ? "default" : "secondary"}>{plan.tier}</Badge>
              <Badge variant={plan.active ? "outline" : "secondary"}>{plan.active ? "Active" : "Inactive"}</Badge>
            </div>
          </div>
        ))}
        {plans.length === 0 && <p className="text-sm text-muted-foreground">No plans yet.</p>}
      </section>
    </div>
  );
}
