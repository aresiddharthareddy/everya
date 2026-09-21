import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** Recreate client when schema adds models (dev hot-reload keeps stale singleton). */
function getPrisma(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && "userFollow" in cached) return cached;

  const client = createPrisma();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

export const prisma = getPrisma();
