import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { traceMemberSchema, updateTraceMemberRoleSchema } from "@/lib/validators";
import {
  addTraceMember,
  getTraceMembers,
  loadStandaloneTrace,
  removeTraceMember,
  updateTraceMemberRole,
} from "@/services/traces";
import { getTraceRole, canManageTraceMembers } from "@/lib/permissions/trace";
import { unauthorized, badRequest, notFound, forbidden, jsonData } from "@/lib/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string; slug: string }> }
) {
  const { username, slug } = await params;
  const trace = await loadStandaloneTrace(username, slug);
  if (!trace) return notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();
  const role = await getTraceRole(trace.id, session.user.id);
  if (!role || !canManageTraceMembers(role)) return forbidden();

  const members = await getTraceMembers(trace.id);
  return jsonData({ members });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string; slug: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const { username, slug } = await params;
  const trace = await loadStandaloneTrace(username, slug);
  if (!trace) return notFound();

  const parsed = traceMemberSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid input");

  const target = await prisma.user.findUnique({
    where: { username: parsed.data.username.replace(/^@/, "") },
  });
  if (!target) return notFound("User not found");

  const result = await addTraceMember(trace.id, session.user.id, target.id, parsed.data.role);
  if (result.error === "forbidden") return forbidden();
  if (result.error === "exists") return badRequest("User is already a member");
  if (result.error === "invalid") return badRequest("Invalid member");

  return jsonData({ ok: true }, 201);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ username: string; slug: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const { username, slug } = await params;
  const body = await req.json();
  const parsed = updateTraceMemberRoleSchema.safeParse(body);
  if (!parsed.success || !body.username) return badRequest("username and role required");

  const trace = await loadStandaloneTrace(username, slug);
  if (!trace) return notFound();

  const target = await prisma.user.findUnique({
    where: { username: String(body.username).replace(/^@/, "") },
  });
  if (!target) return notFound("User not found");

  const result = await updateTraceMemberRole(trace.id, session.user.id, target.id, parsed.data.role);
  if (result.error) return forbidden();
  return jsonData({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ username: string; slug: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const { username, slug } = await params;
  const { username: memberUsername } = await req.json();
  if (!memberUsername) return badRequest("username required");

  const trace = await loadStandaloneTrace(username, slug);
  if (!trace) return notFound();

  const target = await prisma.user.findUnique({
    where: { username: String(memberUsername).replace(/^@/, "") },
  });
  if (!target) return notFound("User not found");

  const result = await removeTraceMember(trace.id, session.user.id, target.id);
  if (result.error === "forbidden") return forbidden();
  if (result.error === "not_found") return notFound();
  return jsonData({ ok: true });
}
