import { expect, test } from "@playwright/test";

// Runs in its own project after the admin specs (playwright.config.ts): signing out
// bumps the admin's session_version, which ends the shared login too.
test("sign out ends the session, and the old cookie lands on sign-in", async ({ page, context }) => {
  await page.goto("/admin");
  const before = await context.cookies();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
  const res = await page.request.get("/admin", { maxRedirects: 0 });
  expect(res.status()).toBe(307);

  // Replay the cookie from before sign-out: refused, and the sign-in form shows (no redirect loop)
  await context.addCookies(before);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Today at a glance" })).toHaveCount(0);
});
