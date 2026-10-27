import { expect, test as setup } from "@playwright/test";
import { config } from "dotenv";
import { mkdirSync } from "node:fs";
import { e2eDatabaseUrl } from "./helpers/db";

config({ path: ".env.local" });

const PUBLIC_ROUTES = ["/", "/menu", "/book", "/catering", "/gallery", "/contact", "/admin/login", "/this-page-does-not-exist"];
const ADMIN_ROUTES = ["/admin", "/admin/reservations", "/admin/menu", "/admin/menu/categories", "/admin/menu/modifiers", "/admin/gallery", "/admin/hours", "/admin/settings"];

setup("admin login + route warm-up", async ({ page }) => {
  // Every project depends on this setup, so the database guard here stops the whole run.
  e2eDatabaseUrl();
  const password = process.env.ADMIN_E2E_PASSWORD || process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("Set ADMIN_E2E_PASSWORD (or ADMIN_PASSWORD) in the environment or .env.local; the e2e admin login has no default password.");

  // Compile every route once so first-hit dev compilation never eats into test timeouts.
  for (const p of PUBLIC_ROUTES) await page.goto(p);

  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL ?? "owner@smokymug.com");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 60_000 });
  await expect(page.getByRole("heading", { name: "Today at a glance" })).toBeVisible();
  mkdirSync("tests/.auth", { recursive: true });
  await page.context().storageState({ path: "tests/.auth/admin.json" });

  for (const p of ADMIN_ROUTES) await page.goto(p);
});
