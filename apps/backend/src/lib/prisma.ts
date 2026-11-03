import { PrismaClient } from "@prisma/client";

// Single shared client — the old code created one PrismaClient per module,
// each with its own connection pool, which wastes memory on a 512MB instance.
export const prisma = new PrismaClient();
