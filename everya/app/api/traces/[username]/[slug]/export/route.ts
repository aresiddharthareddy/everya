import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { buildTraceExport } from "@/lib/trace-export";
import { assertCanViewTrace, loadStandaloneTrace } from "@/services/traces";
import { canEditTraceContent, getTraceRole } from "@/lib/permissions/trace";
import { notFound, forbidden } from "@/lib/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string; slug: string }> }
) {
  const { username, slug } = await params;
  const trace = await loadStandaloneTrace(username, slug);
  if (!trace) return notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!(await assertCanViewTrace(trace, session?.user.id))) return notFound();

  const role = session ? await getTraceRole(trace.id, session.user.id) : null;
  if (!role || !canEditTraceContent(role)) return forbidden();

  const bundle = await buildTraceExport(trace.id);
  if (!bundle) return notFound();

  const filename = `${bundle.slug}-export.json`;
  return new NextResponse(JSON.stringify(bundle, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
