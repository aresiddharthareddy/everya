import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { deleteComment } from "@/services/comments";
import { unauthorized, notFound, jsonData } from "@/lib/api-response";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const { id } = await params;
  const result = await deleteComment(id, session.user.id);
  if (!result) return notFound();

  return jsonData({ ok: true });
}
