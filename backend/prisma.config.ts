import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const configDirectory = dirname(fileURLToPath(import.meta.url));

loadEnv({ path: resolve(configDirectory, "../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
