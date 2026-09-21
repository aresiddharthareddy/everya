import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/lib/validators";
import { unauthorized, badRequest, jsonData, tooManyRequests } from "@/lib/api-response";
import { clientRateLimitKey, rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const limit = rateLimit({
    key: clientRateLimitKey(req, `report:${session.user.id}`),
    limit: 10,
    windowMs: 60_000,
  });
  if (!limit.ok) return tooManyRequests();

  const parsed = reportSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid input");

  const report = await prisma.contentReport.create({
    data: {
      reporterId: session.user.id,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      reason: parsed.data.reason,
    },
  });

  return jsonData({ id: report.id }, 201);
}
