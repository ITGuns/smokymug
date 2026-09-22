import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

/** Browsers probe /favicon.ico regardless of <link rel="icon">; serve the square logo (PNG bytes are accepted). */
export async function GET() {
  const buf = await readFile(join(process.cwd(), "public", "images", "og-square-logo.png"));
  return new NextResponse(buf, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=604800, immutable" } });
}
