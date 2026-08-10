import { prisma } from "../data/prismaClient.js";
import { syncPermissionRegistry } from "../data/syncPermissionRegistry.js";

try {
  const permissions = await syncPermissionRegistry(prisma);
  console.log(`Synced ${permissions.length} registered permissions.`);
} finally {
  await prisma.$disconnect();
}
