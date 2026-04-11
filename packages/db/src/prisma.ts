import { PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

function loadDatabaseEnv() {
  if (process.env.DATABASE_URL) {
    return;
  }

  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  const candidates = [
    path.resolve(currentDir, "../.env"),
    path.resolve(currentDir, "../../.env"),
    path.resolve(currentDir, "../../../.env"),
    path.resolve(currentDir, "../../../../.env"),
  ];

  for (const envPath of candidates) {
    loadEnv({ path: envPath, override: true, quiet: true });

    if (process.env.DATABASE_URL) {
      break;
    }
  }
}

loadDatabaseEnv();

function normalizeEnvValue(value: string | undefined) {
  if (!value) {
    return value;
  }

  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

const databaseUrl = normalizeEnvValue(process.env.DATABASE_URL);

if (databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: databaseUrl
      ? {
          db: {
            url: databaseUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
