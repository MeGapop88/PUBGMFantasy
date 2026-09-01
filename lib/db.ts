import { PrismaClient } from "@prisma/client";

// Next's dev server reloads modules on every edit; without this the process
// accumulates a new pool per reload until the database refuses connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
