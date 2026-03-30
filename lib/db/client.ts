import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "@/lib/db/schema";

function resolveDatabaseUrl() {
  const configured = process.env.DATABASE_URL;

  if (!configured) {
    const defaultPath = join(process.cwd(), "data", "leads.db");
    mkdirSync(dirname(defaultPath), { recursive: true });
    return `file:${defaultPath.replace(/\\/g, "/")}`;
  }

  // Remote Turso / libsql URL — no filesystem needed
  if (configured.startsWith("libsql://") || configured.startsWith("https://")) {
    return configured;
  }

  // Local file-based SQLite (dev only)
  if (configured.startsWith("file:")) {
    const rawPath = configured.slice(5);
    const absolutePath = isAbsolute(rawPath) ? rawPath : join(process.cwd(), rawPath);
    mkdirSync(dirname(absolutePath), { recursive: true });
    return `file:${absolutePath.replace(/\\/g, "/")}`;
  }

  return configured;
}

const url = resolveDatabaseUrl();

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
