import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getTraceByPath } from "@/services/traces";
import { getTraceKnowledge } from "@/services/knowledge";
import { notFound, jsonData } from "@/lib/api-response";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string; slug: string }> }
) {
  const { username, slug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const trace = await getTraceByPath(username, slug);
  if (!trace) return notFound();
  const knowledge = await getTraceKnowledge(trace.id, session?.user.id);
  if (!knowledge) return notFound();
  return jsonData(knowledge);
}
