import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const dbUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:sqlite.db";

const client = createClient({
  url: dbUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client);

export { client as tursoClient };
