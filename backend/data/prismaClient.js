import "../utils/loadEnv.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const hostname = new URL(connectionString).hostname;
const adapter = new PrismaPg({
  connectionString,
  ssl: hostname.endsWith(".render.com")
    ? { rejectUnauthorized: true }
    : undefined,
});

export const prisma = new PrismaClient({ adapter });
