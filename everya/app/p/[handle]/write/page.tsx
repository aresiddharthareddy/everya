import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { getMemberRole } from "@/services/publications";
import { canPublishArticle } from "@/lib/permissions/publication";
import { WriteArticleClient } from "./write-article-client";

export default async function WriteArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await getServerSession();
  if (!session) redirect(`/login?next=/p/${(await params).handle}/write`);

  const { handle } = await params;
  const { id } = await searchParams;

  const publication = await prisma.publication.findUnique({ where: { handle } });
  if (!publication) notFound();

  const role = await getMemberRole(publication.id, session.user.id);
  if (!role || !canPublishArticle(role)) notFound();

  if (!id) {
    return <WriteArticleClient handle={handle} />;
  }

  const article = await prisma.document.findFirst({
    where: { id, publicationId: publication.id },
    select: { id: true, title: true, subtitle: true, content: true, slug: true, status: true, authorId: true },
  });

  if (!article) {
    return <WriteArticleClient handle={handle} initial={null} />;
  }

  if (article.authorId !== session.user.id && !canPublishArticle(role)) {
    return <WriteArticleClient handle={handle} initial={null} />;
  }

  return (
    <WriteArticleClient
      handle={handle}
      initial={{
        id: article.id,
        title: article.title,
        subtitle: article.subtitle,
        content: article.content,
        slug: article.slug,
        status: article.status,
      }}
    />
  );
}
