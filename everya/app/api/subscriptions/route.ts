import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createSubscription, listUserSubscriptions } from "@/services/subscriptions";
import { unauthorized, badRequest, notFound, jsonData } from "@/lib/api-response";
import { z } from "zod";

const createSchema = z.object({ planId: z.string() });

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();
  return jsonData(await listUserSubscriptions(session.user.id));
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest("planId required");

  const sub = await createSubscription(session.user.id, parsed.data.planId);
  if (!sub) return notFound();
  return jsonData(sub);
}
