import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST(req: Request) {
  // Cross-site form posts can't log the admin out.
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) {
    return new NextResponse(null, { status: 403 });
  }
  await destroySession();
  return NextResponse.redirect(new URL("/admin/login", req.url), { status: 303 });
}
