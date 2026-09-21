import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, Heart, MessageCircle, Users, FileText, Star, TrendingUp } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { getWriterStats } from "@/services/stats";
import { formatCount, formatRating } from "@/lib/utils";

export default async function StatsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/stats");

  const stats = await getWriterStats(session.user.id);
  const maxViews = Math.max(...stats.chart.map((d) => d.views), 1);

  return (
    <div className="min-h-full bg-muted/20">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 py-10">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Writer dashboard</p>
          <h1 className="font-serif text-3xl sm:text-4xl tracking-tight">Your stats</h1>
          <p className="text-sm text-muted-foreground mt-2">Performance across all your published stories</p>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          {[
            { icon: Eye, value: formatCount(stats.totalReaders), label: "Lifetime views" },
            { icon: Heart, value: formatCount(stats.totalLikes), label: "Total claps" },
            { icon: MessageCircle, value: formatCount(stats.totalComments), label: "Responses" },
            { icon: Users, value: formatCount(stats.followers), label: "Followers" },
            { icon: FileText, value: String(stats.storyCount), label: "Stories" },
            { icon: Star, value: formatRating(stats.avgRating), label: "Avg rating" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="stat-card p-5">
              <Icon className="h-5 w-5 text-muted-foreground mb-3" strokeWidth={1.5} />
              <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        <section className="stat-card p-6 mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Views — last 30 days
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.chart.reduce((s, d) => s + d.views, 0)} views this month
              </p>
            </div>
          </div>
          <div className="flex items-end gap-1 h-32">
            {stats.chart.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className="w-full rounded-t-sm bg-foreground/80 group-hover:bg-foreground transition-colors min-h-[2px]"
                  style={{ height: `${Math.max(4, (d.views / maxViews) * 100)}%` }}
                  title={`${d.label}: ${d.views} views`}
                />
                {d.views > 0 && (
                  <span className="text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.views}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
            <span>{stats.chart[0]?.label}</span>
            <span>{stats.chart[stats.chart.length - 1]?.label}</span>
          </div>
        </section>

        <section>
          <h2 className="font-medium mb-4">Story performance</h2>
          {stats.stories.length === 0 ? (
            <div className="stat-card p-8 text-center text-sm text-muted-foreground">
              No stories yet.{" "}
              <Link href="/dashboard/new" className="underline">Create a collection</Link> and start writing.
            </div>
          ) : (
            <div className="stat-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Story</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Views</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Claps</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Responses</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.stories.map((story) => (
                    <tr key={story.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={story.href} className="font-medium hover:underline line-clamp-1">
                          {story.title}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5 sm:hidden">
                          {formatCount(story.readerCount)} views · {story.likeCount} claps
                        </p>
                      </td>
                      <td className="px-4 py-3 tabular-nums hidden sm:table-cell">{formatCount(story.readerCount)}</td>
                      <td className="px-4 py-3 tabular-nums hidden sm:table-cell">{story.likeCount}</td>
                      <td className="px-4 py-3 tabular-nums hidden md:table-cell">{story.commentCount}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {story.avgRating > 0 ? `${formatRating(story.avgRating)} ★` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
