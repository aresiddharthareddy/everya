import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { unauthorized, badRequest, jsonData, tooManyRequests } from "@/lib/api-response";
import { clientRateLimitKey, rateLimit } from "@/lib/rate-limit";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const limit = rateLimit({
    key: clientRateLimitKey(req, `upload:${session.user.id}`),
    limit: 20,
    windowMs: 60_000,
  });
  if (!limit.ok) return tooManyRequests();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return badRequest("No file provided");
  if (file.size > 8 * 1024 * 1024) return badRequest("File too large (max 8MB)");
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return badRequest("Only image uploads are allowed (JPEG, PNG, WebP, GIF)");
  }

  const uploadDir = path.join(process.cwd(), "storage", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name) || ".png";
  const filename = `${uuidv4()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const optimized = await sharp(buffer)
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
  const webpName = filename.replace(ext, ".webp");
  await writeFile(path.join(uploadDir, webpName), optimized);

  return jsonData({ url: `/api/files/${webpName}` });
}
