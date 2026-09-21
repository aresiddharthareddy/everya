import { getCreatorProfile } from "@/services/creator";
import { jsonData, notFound } from "@/lib/api-response";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const profile = await getCreatorProfile(username.replace(/^@/, ""));
  if (!profile) return notFound();
  return jsonData(profile);
}
