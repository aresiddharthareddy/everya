import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPaymentProvider } from "@/lib/payments";
import { unauthorized, badRequest, jsonData } from "@/lib/api-response";
import { z } from "zod";

const schema = z.object({
  planId: z.string(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid input");

  const provider = getPaymentProvider();
  const result = await provider.createCheckoutSession({
    userId: session.user.id,
    planId: parsed.data.planId,
    successUrl: parsed.data.successUrl,
    cancelUrl: parsed.data.cancelUrl,
  });

  if (!result.ok) {
    return jsonData({ error: result.code, message: result.message }, 503);
  }

  return jsonData({ url: result.url, sessionId: result.sessionId });
}
