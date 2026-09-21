import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicationMemberSchema, updateMemberRoleSchema } from "@/lib/validators";
import {
  addPublicationMember,
  getMemberRole,
  removePublicationMember,
  updateMemberRole,
} from "@/services/publications";
import { unauthorized, badRequest, notFound, forbidden, jsonData } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const { handle } = await params;
  const pub = await prisma.publication.findUnique({ where: { handle } });
  if (!pub) return notFound();

  const parsed = publicationMemberSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid input");

  const target = await prisma.user.findUnique({ where: { username: parsed.data.username.replace(/^@/, "") } });
  if (!target) return notFound("User not found");

  const result = await addPublicationMember(pub.id, session.user.id, target.id, parsed.data.role);
  if (result.error === "forbidden") return forbidden();
  if (result.error === "exists") return badRequest("User is already a member");

  return jsonData({ ok: true }, 201);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const { handle } = await params;
  const body = await req.json();
  const parsed = updateMemberRoleSchema.safeParse(body);
  if (!parsed.success || !body.username) return badRequest("username and role required");
  const username = body.username;

  const pub = await prisma.publication.findUnique({ where: { handle } });
  if (!pub) return notFound();

  const target = await prisma.user.findUnique({ where: { username: String(username).replace(/^@/, "") } });
  if (!target) return notFound("User not found");

  const result = await updateMemberRole(pub.id, session.user.id, target.id, parsed.data.role);
  if (result.error) return forbidden();
  return jsonData({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const { handle } = await params;
  const { username } = await req.json();
  if (!username) return badRequest("username required");

  const pub = await prisma.publication.findUnique({ where: { handle } });
  if (!pub) return notFound();

  const target = await prisma.user.findUnique({ where: { username: String(username).replace(/^@/, "") } });
  if (!target) return notFound("User not found");

  const result = await removePublicationMember(pub.id, session.user.id, target.id);
  if (result.error) return forbidden();
  return jsonData({ ok: true });
}
