import "server-only";
import { eq } from "drizzle-orm";
import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";

export const SESSION_COOKIE = "sm_admin";
const SESSION_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

export type AdminSession = { sub: number; email: string; name: string; role: string; sv: number };

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET must be set (16+ chars) in .env.local");
  // The .env.example placeholder signs valid admin JWTs if it ever reaches production.
  if (process.env.NODE_ENV === "production" && (s.length < 32 || s.includes("change-me"))) {
    throw new Error("SESSION_SECRET is a placeholder or under 32 chars; set a real secret (openssl rand -hex 32)");
  }
  return new TextEncoder().encode(s);
}

export async function createSession(user: AdminSession): Promise<void> {
  const token = await new SignJWT({ email: user.email, name: user.name, role: user.role, sv: user.sv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.sub))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SEC}s`)
    .sign(secret());
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SEC,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function verifySessionToken(token: string | undefined): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return {
      sub: Number(payload.sub),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: String(payload.role ?? "admin"),
      sv: Number(payload.sv ?? 0),
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

/** A password change bumps session_version, so older cookies stop working everywhere. */
async function sessionIsCurrent(session: AdminSession): Promise<boolean> {
  const [row] = await db
    .select({ v: schema.adminUsers.sessionVersion })
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.id, session.sub))
    .limit(1);
  return !!row && row.v === session.sv;
}

/** Use in server actions + route handlers: throws if not authenticated. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getSession();
  if (!session || !(await sessionIsCurrent(session))) throw new Error("UNAUTHORIZED");
  return session;
}

/** Use in admin pages/layouts: redirects to login. */
export async function requireAdminPage(): Promise<AdminSession> {
  const session = await getSession();
  if (!session || !(await sessionIsCurrent(session))) {
    const h = await headers();
    const next = h.get("x-pathname") ?? "/admin";
    redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  }
  return session;
}

export async function clientKey(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || h.get("x-real-ip") || "local";
}
