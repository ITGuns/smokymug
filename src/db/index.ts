import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add your Supabase connection string to .env.local.");
  return postgres(url, {
    // Supavisor transaction pooling does not support prepared statements.
    prepare: false,
    ssl: "require",
    max: process.env.NODE_ENV === "production" ? 4 : 8,
    idle_timeout: 20,
    connect_timeout: 15,
  });
}

declare global {
  // eslint-disable-next-line no-var
  var __smokyPg: ReturnType<typeof createClient> | undefined;
}

// Reuse one client across Next.js hot reloads / route modules.
const client = globalThis.__smokyPg ?? createClient();
if (process.env.NODE_ENV !== "production") globalThis.__smokyPg = client;

export const db = drizzle(client, { schema });
export { schema };
export type Db = typeof db;
/** Either the root db or a transaction handle. */
export type DbLike = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];
