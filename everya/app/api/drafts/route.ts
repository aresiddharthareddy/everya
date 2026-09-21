import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { listEditableDrafts } from "@/services/drafts";
import { unauthorized, jsonData } from "@/lib/api-response";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const drafts = await listEditableDrafts(session.user.id);
  return jsonData({ drafts });
}
