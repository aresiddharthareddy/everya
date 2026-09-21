import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { documentLinkSchema } from "@/lib/validators";
import { addDocumentLink, getDocumentLinks, removeDocumentLink } from "@/services/document-links";
import { traceDocumentHref } from "@/services/traces";
import { unauthorized, badRequest, notFound, forbidden, jsonData } from "@/lib/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const links = await getDocumentLinks(id);
  return jsonData({
    links: links.map((l) => ({
      id: l.id,
      type: l.type,
      href: traceDocumentHref(l.document.repository, l.document.slug),
      document: { id: l.document.id, title: l.document.title, slug: l.document.slug },
    })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const { id } = await params;
  const parsed = documentLinkSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid input");

  const result = await addDocumentLink(id, session.user.id, parsed.data.toDocumentId, parsed.data.type);
  if (result.error === "not_found") return notFound();
  if (result.error === "forbidden") return forbidden();
  if (result.error === "invalid") return badRequest("Invalid link target");

  return jsonData(result.link, 201);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const { linkId } = await req.json();
  if (!linkId) return badRequest("linkId required");

  const result = await removeDocumentLink(String(linkId), session.user.id);
  if (result.error === "not_found") return notFound();
  if (result.error === "forbidden") return forbidden();
  return jsonData({ ok: true });
}
