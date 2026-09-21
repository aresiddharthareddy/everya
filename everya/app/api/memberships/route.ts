import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { listUserMemberships } from "@/services/memberships";
import { unauthorized, jsonData } from "@/lib/api-response";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();
  return jsonData(await listUserMemberships(session.user.id));
}
