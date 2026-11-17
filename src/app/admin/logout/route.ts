import { NextResponse } from "next/server";
import { endSession } from "@/lib/auth";

/** Cross-site form posts can't log the admin out. A missing Origin passes as before;
 *  one that is "null", not a URL, or another host is refused (it used to throw a 500). */
function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return new NextResponse(null, { status: 403 });
  await endSession();
  return NextResponse.redirect(new URL("/admin/login", req.url), { status: 303 });
}
