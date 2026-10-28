import { config } from "dotenv";
import { Pool } from "pg";

config({ path: ".env.local" });

/** Hosted Supabase (live data). The suite runs raw DELETEs and rewrites settings, so it never runs there by accident. */
const REMOTE_DB = /supabase\.(co|com)/i;

/**
 * The single place e2e code resolves its database. Prefers E2E_DATABASE_URL, falls back to
 * DATABASE_URL, and refuses a Supabase host unless E2E_ALLOW_REMOTE=1 is set explicitly.
 * auth.setup.ts calls this first so a refused run stops before any spec starts.
 */
export function e2eDatabaseUrl(): string {
  const source = process.env.E2E_DATABASE_URL ? "E2E_DATABASE_URL" : "DATABASE_URL";
  const url = process.env[source];
  if (!url) throw new Error("E2E_DATABASE_URL or DATABASE_URL must be set for the e2e suite.");
  // Matched against the whole string, not a parsed host: a password with "@" or a ?host= param can't slip past.
  if (REMOTE_DB.test(url) && process.env.E2E_ALLOW_REMOTE !== "1") {
    throw new Error(
      `Refusing to run e2e against a Supabase database (${source}). The suite deletes rows and changes settings. ` +
        `Point E2E_DATABASE_URL at a local or disposable database, or set E2E_ALLOW_REMOTE=1 to run against it on purpose.`,
    );
  }
  return url;
}

let pool: Pool | undefined;
function db(): Pool {
  if (!pool) {
    const url = e2eDatabaseUrl();
    // Same TLS rule as src/db/index.ts: a local database opts out with ?sslmode=disable.
    pool = new Pool({ connectionString: url, ssl: /sslmode=disable/.test(url) ? undefined : { rejectUnauthorized: false }, max: 2 });
  }
  return pool;
}

export async function query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await db().query(text, params);
  return res.rows as T[];
}

/** Every record the suite creates is tagged so cleanup is exact. */
export const QA = {
  emailDomain: "qa.smokymug.test",
  prefix: "QA ",
};

export async function cleanupAll() {
  await query(`delete from reservations where email like $1`, [`%@${QA.emailDomain}`]);
  await query(`delete from catering_inquiries where email like $1`, [`%@${QA.emailDomain}`]);
  await query(`delete from menu_items where name like $1`, [`${QA.prefix}%`]);
  await query(`delete from menu_sections where name like $1`, [`${QA.prefix}%`]);
  await query(`delete from menu_categories where name like $1`, [`${QA.prefix}%`]);
  await query(`delete from modifier_groups where name like $1`, [`${QA.prefix}%`]);
  await query(`delete from date_overrides where reason like $1`, [`${QA.prefix}%`]);
  await query(`delete from booking_windows where label like $1`, [`${QA.prefix}%`]);
  await query(`delete from uploads where name like $1`, [`qa-%`]);
}

export async function insertReservations(rows: { date: string; time: string; partySize: number; status?: string }[]) {
  for (const [i, r] of rows.entries()) {
    await query(
      `insert into reservations (confirmation_code, manage_token, first_name, last_name, email, phone, party_size, date, time, status, source)
       values ($1, $2, 'QA', 'Seat', $3, '(804) 555-0100', $4, $5, $6, $7, 'test')`,
      [`QA-${Date.now()}-${i}`, `qa-token-${Date.now()}-${i}`, `qa-cap-${i}@${QA.emailDomain}`, r.partySize, r.date, r.time, r.status ?? "confirmed"],
    );
  }
}

export async function reservationByCode(code: string) {
  const [row] = await query<{ status: string; party_size: number; email: string; source: string }>(`select status, party_size, email, source from reservations where confirmation_code = $1`, [code]);
  return row;
}

export async function closePool() {
  await pool?.end();
  pool = undefined;
}
