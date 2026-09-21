import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { listUserMemberships } from "@/services/memberships";
import { listUserSubscriptions } from "@/services/subscriptions";
import { isPaymentConfigured } from "@/lib/payments";
import { PageHeader } from "@/components/navigation/page-header";
import { Badge } from "@/components/ui/badge";
import { formatUsername } from "@/lib/utils";

export default async function MembershipsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/memberships");

  const [memberships, subscriptions] = await Promise.all([
    listUserMemberships(session.user.id),
    listUserSubscriptions(session.user.id),
  ]);

  return (
    <div className="page-container py-page max-w-3xl space-y-10">
      <PageHeader
        eyebrow="Access"
        title="Memberships & subscriptions"
        description="Your creator economy relationships — separate from social follows."
      />

      {!isPaymentConfigured() && (
        <p className="text-sm text-muted-foreground rounded-lg border px-4 py-3">
          Checkout unavailable: payment provider credentials not configured.
        </p>
      )}

      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Memberships</h2>
        <div className="space-y-3">
          {memberships.map((m) => (
            <div key={m.id} className="stat-card p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">
                  {m.publication?.name || m.repository?.name || formatUsername(m.creator.username)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Creator {formatUsername(m.creator.username)}
                  {m.plan ? ` · ${m.plan.name}` : ""}
                </p>
              </div>
              <Badge variant={m.status === "ACTIVE" ? "default" : "secondary"}>{m.status}</Badge>
            </div>
          ))}
          {memberships.length === 0 && <p className="text-sm text-muted-foreground">No memberships yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Subscriptions</h2>
        <div className="space-y-3">
          {subscriptions.map((s) => (
            <div key={s.id} className="stat-card p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{s.plan.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatUsername(s.plan.creator.username)} · ${(s.plan.priceCents / 100).toFixed(2)}/{s.plan.interval}
                </p>
              </div>
              <Badge variant={s.status === "ACTIVE" ? "default" : "secondary"}>{s.status}</Badge>
            </div>
          ))}
          {subscriptions.length === 0 && <p className="text-sm text-muted-foreground">No subscriptions yet.</p>}
        </div>
      </section>

      <Link href="/creator" className="text-sm text-muted-foreground hover:text-foreground">
        Creator dashboard →
      </Link>
    </div>
  );
}
