import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validators";
import { unauthorized, badRequest, jsonData } from "@/lib/api-response";

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorized();

  const parsed = updateProfileSchema.safeParse(await req.json());
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message || "Invalid input", parsed.error.flatten());
  }

  const { name, bio, website, image } = parsed.data;
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name?.trim() || null,
      bio: bio?.trim() || null,
      website: website?.trim() || null,
      image: image ?? undefined,
    },
    select: {
      id: true,
      name: true,
      bio: true,
      website: true,
      image: true,
      username: true,
      email: true,
    },
  });

  return jsonData(user);
}
