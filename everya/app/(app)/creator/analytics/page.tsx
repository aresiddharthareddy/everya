import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Eye, Users, CreditCard, Lock } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { getCreatorAnalytics } from "@/services/creator-analytics";
import { formatCount } from "@/lib/utils";

export default async function CreatorAnalyticsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/creator/analytics");

  const stats = await getCreatorAnalytics(session.user.id);

  return (
    <div className="min-h-full bg-muted/20">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 py-10">
        <Link href="/creator" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Creator dashboard
        </Link>
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Last {stats.periodDays} days</p>
          <h1 className="font-serif text-3xl tracking-tight">Creator analytics</h1>
        </header>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { icon: Eye, label: "Document views", value: stats.documentViews },
            { icon: Users, label: "Unique readers", value: stats.uniqueReaders },
            { icon: Users, label: "Followers", value: stats.followers },
            { icon: Users, label: "Members", value: stats.members },
            { icon: CreditCard, label: "Subscriptions", value: stats.activeSubscriptions },
            { icon: Lock, label: "Premium docs", value: stats.premiumDocumentCount },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="stat-card p-5">
              <Icon className="h-5 w-5 text-muted-foreground mb-3" strokeWidth={1.5} />
              <p className="text-2xl font-semibold tabular-nums">{formatCount(value)}</p>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
        <div className="stat-card p-6 mt-6">
          <p className="text-sm text-muted-foreground">Premium content views (30d)</p>
          <p className="text-2xl font-semibold mt-1">{formatCount(stats.premiumContentViews)}</p>
          <p className="text-sm text-muted-foreground mt-4">Revenue (30d)</p>
          <p className="text-2xl font-semibold mt-1">${(stats.revenueCents30d / 100).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
