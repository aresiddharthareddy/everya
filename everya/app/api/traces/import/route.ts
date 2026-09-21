import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { importTraceFromFiles, validateImportFiles, type ImportFile } from "@/lib/trace-import";
import { unauthorized, badRequest, jsonData, tooManyRequests } from "@/lib/api-response";
import { clientRateLimitKey, rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  files: z.array(z.object({ path: z.string().min(1), content: z.string() })).min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const limit = rateLimit({
    key: clientRateLimitKey(req, `trace-import:${session.user.id}`),
    limit: 5,
    windowMs: 300_000,
  });
  if (!limit.ok) return tooManyRequests();

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid input");

  const { name, description, files } = parsed.data;
  const validation = validateImportFiles(files as ImportFile[]);
  if (!validation.ok) return badRequest(validation.errors.join(" "));

  try {
    const result = await importTraceFromFiles({
      ownerId: session.user.id,
      name,
      description,
      files: files as ImportFile[],
    });
    return jsonData({
      slug: result.slug,
      documentCount: result.documentCount,
      href: `/u/${result.username}/trace/${result.slug}`,
    });
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : "Import failed");
  }
}
