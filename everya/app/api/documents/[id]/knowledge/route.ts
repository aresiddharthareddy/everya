import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDocumentKnowledge } from "@/services/knowledge";
import { notFound, jsonData } from "@/lib/api-response";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { id } = await params;
  const knowledge = await getDocumentKnowledge(id, session?.user.id);
  if (!knowledge) return notFound();
  return jsonData(knowledge);
}
