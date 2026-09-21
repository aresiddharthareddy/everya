import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createMembershipPlan, listPlansForScope } from "@/services/memberships";
import { unauthorized, badRequest, notFound, jsonData } from "@/lib/api-response";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  tier: z.enum(["MEMBER", "PREMIUM"]).optional(),
  priceCents: z.number().int().min(0),
  currency: z.string().length(3).optional(),
  interval: z.enum(["month", "year"]).optional(),
  publicationId: z.string().optional(),
  repositoryId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const plans = await listPlansForScope({
    publicationId: searchParams.get("publicationId") || undefined,
    repositoryId: searchParams.get("repositoryId") || undefined,
    creatorId: searchParams.get("creatorId") || undefined,
  });
  return jsonData(plans);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid input");
  if (!parsed.data.publicationId && !parsed.data.repositoryId) {
    return badRequest("publicationId or repositoryId required");
  }

  const plan = await createMembershipPlan(session.user.id, parsed.data);
  if (!plan) return notFound();
  return jsonData(plan);
}
