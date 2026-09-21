import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getForYouFeed, getFollowingFeed, getLatestFeed, getTrendingFeed, articleHref } from "@/services/feed";
import { jsonData, tooManyRequests, unauthorized } from "@/lib/api-response";
import { clientRateLimitKey, rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const limit = rateLimit({
    key: clientRateLimitKey(req, "feed"),
    limit: 120,
    windowMs: 60_000,
  });
  if (!limit.ok) return tooManyRequests();

  const tab = req.nextUrl.searchParams.get("tab") || "latest";
  const session = await auth.api.getSession({ headers: await headers() });

  let docs;
  if (tab === "following") {
    if (!session) return unauthorized();
    docs = await getFollowingFeed(session.user.id);
  } else if (tab === "for-you") {
    if (!session) return unauthorized();
    docs = await getForYouFeed(session.user.id);
  } else if (tab === "trending") {
    docs = await getTrendingFeed(session?.user.id);
  } else {
    docs = await getLatestFeed(session?.user.id);
  }

  return jsonData({
    items: docs.map((d) => ({
      id: d.id,
      title: d.title,
      subtitle: d.subtitle,
      excerpt: d.excerpt,
      href: articleHref(d),
      author: d.author,
      publication: d.publication,
      publishedAt: d.publishedAt?.toISOString() ?? d.updatedAt.toISOString(),
      stats: { likes: d._count.likes, comments: d._count.comments, readers: d.readerCount },
      tags: d.tags.map((t) => t.tag),
    })),
  });
}
