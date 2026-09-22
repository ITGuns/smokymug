import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * node-postgres never pipelines queries on a connection, which keeps results
 * correctly attributed through Supabase's transaction-mode pooler even under
 * the concurrent, cold-start heavy access pattern of serverless functions.
 */
function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add your Supabase connection string to .env.local.");
  return new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    max: process.env.NODE_ENV === "production" ? 4 : 8,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 15_000,
  });
}

declare global {
  // eslint-disable-next-line no-var
  var __smokyPool: Pool | undefined;
}

// Reuse one pool across Next.js hot reloads / route modules.
const pool = globalThis.__smokyPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalThis.__smokyPool = pool;

export const db = drizzle(pool, { schema });
export { schema };
export type Db = typeof db;
/** Either the root db or a transaction handle. */
export type DbLike = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];
