import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, CreditCard, FileText, TrendingUp, DollarSign } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { getCreatorDashboard } from "@/services/creator";
import { isPaymentConfigured } from "@/lib/payments";
import { PageHeader } from "@/components/navigation/page-header";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/utils";

export default async function CreatorDashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/creator");

  const data = await getCreatorDashboard(session.user.id);
  const paymentReady = isPaymentConfigured();

  return (
    <div className="min-h-full bg-muted/15">
      <div className="page-container py-page max-w-5xl space-y-10">
        <PageHeader
          eyebrow="Creator economy"
          title="Creator dashboard"
          description="Publications, traces, members, and revenue from real data."
          actions={
            <div className="flex gap-2">
              <Link href="/creator/plans">
                <Button variant="outline" size="sm">Plans</Button>
              </Link>
              <Link href="/creator/analytics">
                <Button variant="outline" size="sm">
                  <TrendingUp className="h-4 w-4" /> Analytics
                </Button>
              </Link>
            </div>
          }
        />

        {!paymentReady && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
            Payment provider not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to enable checkout.
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Users, label: "Members", value: data.economy.members },
            { icon: CreditCard, label: "Subscriptions", value: data.economy.activeSubscriptions },
            { icon: FileText, label: "Active plans", value: data.economy.activePlans },
            {
              icon: DollarSign,
              label: "Revenue",
              value: `$${(data.economy.totalRevenueCents / 100).toFixed(2)}`,
            },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="stat-card p-5">
              <Icon className="h-5 w-5 text-muted-foreground mb-3" strokeWidth={1.5} />
              <p className="text-2xl font-semibold tabular-nums">{typeof value === "number" ? formatCount(value) : value}</p>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        <section className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Publications</h2>
            <div className="space-y-2">
              {data.publications.map((p) => (
                <Link key={p.id} href={`/p/${p.handle}`} className="stat-card block p-4 hover:shadow-md transition-shadow">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p._count.followers} followers · {p._count.articles} articles
                  </p>
                </Link>
              ))}
              {data.publications.length === 0 && <p className="text-sm text-muted-foreground">No publications yet.</p>}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Traces</h2>
            <div className="space-y-2">
              {data.traces.map((t) => (
                <Link
                  key={t.id}
                  href={`/u/${session.user.username}/trace/${t.slug}`}
                  className="stat-card block p-4 hover:shadow-md transition-shadow"
                >
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t._count.followers} followers · {t._count.documents} docs
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="stat-card p-5">
          <h2 className="font-medium mb-2">Payout balance</h2>
          <p className="text-sm text-muted-foreground mb-4">Payout transfers require payment provider Connect configuration.</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Available</p>
              <p className="text-lg font-semibold">${(data.economy.payout.availableCents / 100).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Pending</p>
              <p className="text-lg font-semibold">${(data.economy.payout.pendingCents / 100).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Paid out</p>
              <p className="text-lg font-semibold">${(data.economy.payout.totalPaidCents / 100).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
