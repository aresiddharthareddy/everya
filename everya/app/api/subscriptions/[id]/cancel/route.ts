import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { cancelSubscription } from "@/services/subscriptions";
import { unauthorized, notFound, jsonData } from "@/lib/api-response";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const { id } = await params;
  const sub = await cancelSubscription(id, session.user.id);
  if (!sub) return notFound();
  return jsonData(sub);
}
