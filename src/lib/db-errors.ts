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

/** The Postgres error code (e.g. "23505") from a driver or Drizzle-wrapped error, else "unknown".
 *  Log THIS, never the error object: DrizzleQueryError's message carries the query params,
 *  which for guest forms means name, email, phone and notes (spec 5.7, P7). */
export function pgCode(err: unknown): string {
  let e: unknown = err;
  for (let depth = 0; e && depth < 3; depth++) {
    const code = (e as { code?: unknown }).code;
    if (typeof code === "string" && /^[0-9A-Z]{5}$/.test(code)) return code;
    e = (e as { cause?: unknown }).cause;
  }
  return "unknown";
}

/** Shown in admin when a new setting's table is missing on this database. */
export const NEEDS_DB_PUSH = "This setting needs a one-time database update first (npm run db:push). Nothing was saved.";
