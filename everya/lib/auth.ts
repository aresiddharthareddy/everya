import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

const origin = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:43123";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: origin,
  trustedOrigins: [
    origin,
    "http://localhost:43123",
    "http://127.0.0.1:43123",
    "http://localhost",
    "http://127.0.0.1",
    (request: Request) => {
      const raw = request.headers.get("origin") || "";
      try {
        return new URL(raw).origin;
      } catch {
        return origin;
      }
    },
  ],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
        unique: true,
      },
      bio: {
        type: "string",
        required: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
});

export type Session = typeof auth.$Infer.Session;
