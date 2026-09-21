import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { publishArticle } from "@/services/articles";
import { unauthorized, notFound, jsonData } from "@/lib/api-response";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const { id } = await params;
  const article = await publishArticle(id, session.user.id);
  if (!article) return notFound();

  return jsonData(article);
}
