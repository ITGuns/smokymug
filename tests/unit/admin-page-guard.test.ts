import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// 18 Nov 2026: Next renders the panel layout and its page in parallel, so the layout's
// requireAdminPage() alone let a signed-out (revoked) cookie read a page's data in the
// 307 body. Every admin page checks the session itself, first, before any read.

const PANEL = path.resolve(__dirname, "../../src/app/admin/(panel)");

function pages(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? pages(path.join(dir, e.name)) : e.name === "page.tsx" ? [path.join(dir, e.name)] : [],
  );
}

describe("admin pages check the session before reading data", () => {
  const files = pages(PANEL);

  it("finds the panel pages", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(files.map((f) => [path.relative(PANEL, f), f]))("%s calls requireAdminPage() first", (_, file) => {
    const src = readFileSync(file, "utf8");
    expect(src).toMatch(/export default async function \w+\(.*\)\s*\{\r?\n\s*await requireAdminPage\(\);/);
  });
});
