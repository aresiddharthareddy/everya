import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getCreatorAnalytics } from "@/services/creator-analytics";
import { unauthorized, jsonData } from "@/lib/api-response";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();
  return jsonData(await getCreatorAnalytics(session.user.id));
}
