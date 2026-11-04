import { expect, type Page } from "@playwright/test";

/** Waits for a toast with `text` to show and then clear, so consecutive saves can't reuse a stale toast. */
export async function expectToast(page: Page, text: string | RegExp) {
  const status = page.getByRole("status").first();
  await expect(status).toContainText(text);
  await expect(status).not.toContainText(text, { timeout: 10_000 });
}

/** Navigate and wait for hydration-relevant network to settle before interacting with forms. */
export async function gotoReady(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

/** /admin/menu's new-item drawer, opened by a click so the form is hydrated before the first
 *  keystroke (an SSR-open drawer from ?new=1 can take a fill before React attaches, and the
 *  value is lost). A click before hydration does nothing, so it retries until the drawer opens. */
export async function openNewItemDrawer(page: Page) {
  await gotoReady(page, "/admin/menu");
  const drawer = page.getByRole("dialog", { name: "New menu item" });
  await expect(async () => {
    await page.getByRole("button", { name: "+ Add item" }).click();
    await expect(drawer.getByLabel("Item name")).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  return drawer;
}
