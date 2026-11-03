/** Postgres codes for "this table/column does not exist yet": a database that
 *  has not run `db:push` since a release added it (undefined_table,
 *  undefined_column). Drizzle wraps driver errors, so check the cause too. */
const MISSING_SCHEMA = new Set(["42P01", "42703"]);

export function isMissingSchema(err: unknown): boolean {
  let e: unknown = err;
  for (let depth = 0; e && depth < 3; depth++) {
    const code = (e as { code?: unknown }).code;
    if (typeof code === "string" && MISSING_SCHEMA.has(code)) return true;
    e = (e as { cause?: unknown }).cause;
  }
  return false;
}

/** Shown in admin when a new setting's table is missing on this database. */
export const NEEDS_DB_PUSH = "This setting needs a one-time database update first (npm run db:push). Nothing was saved.";
