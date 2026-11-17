import { randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Audit F6 + F1 (18 Nov 2026). Sign-out must raise admin_users.session_version so a
// copied cookie stops working, and a bad Origin header must be refused, never a 500.
// CI unit tests run with no database, so admin_users and the cookie jar are faked.

type Col = { name: string };
type Cond = { op: "eq"; col: Col; val: unknown } | { op: "and"; conds: Cond[] };

const state = vi.hoisted(() => {
  const s = {
    row: { id: 1, sessionVersion: 1 } as Record<string, unknown>,
    jar: new Map<string, string>(),
    updates: 0,
    matches(cond: Cond): boolean {
      return cond.op === "and" ? cond.conds.every((c) => s.matches(c)) : s.row[cond.col.name] === cond.val;
    },
  };
  return s;
});

vi.mock("drizzle-orm", async (importOriginal) => ({
  ...(await importOriginal<typeof import("drizzle-orm")>()),
  eq: (col: Col, val: unknown) => ({ op: "eq", col, val }),
  and: (...conds: Cond[]) => ({ op: "and", conds }),
}));

vi.mock("@/db", () => {
  const col = (name: string) => ({ name });
  const adminUsers = { id: col("id"), sessionVersion: col("sessionVersion"), updatedAt: col("updatedAt") };
  const db = {
    select: (shape: Record<string, Col>) => ({
      from: () => ({
        where: (cond: Cond) => ({
          limit: async () => (state.matches(cond) ? [Object.fromEntries(Object.entries(shape).map(([k, c]) => [k, state.row[c.name]]))] : []),
        }),
      }),
    }),
    update: () => ({
      set: (patch: Record<string, unknown>) => ({
        where: async (cond: Cond) => {
          if (!state.matches(cond)) return;
          state.row = { ...state.row, ...patch };
          state.updates++;
        },
      }),
    }),
  };
  return { db, schema: { adminUsers } };
});

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (state.jar.has(name) ? { name, value: state.jar.get(name) } : undefined),
    set: (name: string, value: string) => void state.jar.set(name, value),
    delete: (name: string) => void state.jar.delete(name),
  }),
  headers: async () => new Headers(),
}));

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT ${to}`);
  },
}));

if (!process.env.SESSION_SECRET) process.env.SESSION_SECRET = randomBytes(24).toString("hex");

const auth = await import("@/lib/auth");
const { POST } = await import("@/app/admin/logout/route");

const ADMIN = { sub: 1, email: "owner@example.com", name: "Owner", role: "admin" };
const signOut = (origin?: string) =>
  POST(new Request("http://localhost:3107/admin/logout", { method: "POST", headers: origin === undefined ? {} : { origin } }));

beforeEach(() => {
  state.row = { id: 1, sessionVersion: 1 };
  state.jar.clear();
  state.updates = 0;
});

describe("POST /admin/logout (F6)", () => {
  it("raises session_version so a cookie minted before sign-out is rejected afterwards", async () => {
    await auth.createSession({ ...ADMIN, sv: 1 });
    const token = state.jar.get(auth.SESSION_COOKIE);
    expect(token).toBeTruthy();
    const before = await auth.verifySessionToken(token);
    expect(before && (await auth.sessionIsCurrent(before))).toBe(true);

    const res = await signOut("http://localhost:3107");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost:3107/admin/login");
    expect(state.jar.has(auth.SESSION_COOKIE)).toBe(false);
    expect(state.row.sessionVersion).toBe(2);

    // Replay the copied cookie: the signature still checks out, the session does not.
    const replay = await auth.verifySessionToken(token);
    expect(replay).not.toBeNull();
    expect(await auth.sessionIsCurrent(replay!)).toBe(false);
    state.jar.set(auth.SESSION_COOKIE, token!);
    await expect(auth.requireAdmin()).rejects.toThrow("UNAUTHORIZED");
  });

  it("a stale cookie cannot sign out a newer session", async () => {
    await auth.createSession({ ...ADMIN, sv: 1 });
    state.row = { id: 1, sessionVersion: 3 };
    const res = await signOut("http://localhost:3107");
    expect(res.status).toBe(303);
    expect(state.row.sessionVersion).toBe(3);
    expect(state.updates).toBe(0);
    expect(state.jar.has(auth.SESSION_COOKIE)).toBe(false);
  });

  it("with no session cookie it still lands on sign-in and writes nothing", async () => {
    const res = await signOut();
    expect(res.status).toBe(303);
    expect(state.updates).toBe(0);
  });
});

describe("POST /admin/logout Origin check (F1)", () => {
  it.each(["null", "not a url", "http://evil.example"])("refuses Origin %j with 403 and leaves the session alone", async (origin) => {
    await auth.createSession({ ...ADMIN, sv: 1 });
    const res = await signOut(origin);
    expect(res.status).toBe(403);
    expect(state.row.sessionVersion).toBe(1);
    expect(state.updates).toBe(0);
    expect(state.jar.has(auth.SESSION_COOKIE)).toBe(true);
  });
});
