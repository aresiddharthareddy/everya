import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getCreatorDashboard } from "@/services/creator";
import { unauthorized, jsonData } from "@/lib/api-response";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();
  return jsonData(await getCreatorDashboard(session.user.id));
}
