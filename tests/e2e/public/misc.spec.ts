import { expect, test } from "@playwright/test";

test.describe("Other public pages & routes", () => {
  test("contact page has the real business details and CTAs", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Come say hi.");
    await expect(page.locator("main").getByRole("link", { name: /2930 North Avenue/ }).first()).toHaveAttribute("href", /google\.com\/maps/);
    await expect(page.getByRole("link", { name: "(804) 562-3722" }).first()).toHaveAttribute("href", "tel:+18045623722");
    await expect(page.getByRole("link", { name: "thesmokymug@gmail.com" }).first()).toHaveAttribute("href", "mailto:thesmokymug@gmail.com");
    await expect(page.getByText("Sunday brunch").first()).toBeVisible();
  });

  test("gallery lightbox opens, navigates and closes", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Come hungry.");
    await page.getByRole("tab", { name: "Coffee" }).click();
    const first = page.locator("ul.columns-2 button").first();
    await first.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("figcaption")).toContainText(/1 \/ \d+/);
    await page.keyboard.press("ArrowRight");
    await expect(dialog.locator("figcaption")).toContainText(/2 \/ \d+/);
    await expect(page).toHaveURL(/photo=\d+/);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("gallery deep link opens the lightbox", async ({ page }) => {
    await page.goto("/gallery?photo=1");
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("404, sitemap, robots, favicon, uploads and admin guard", async ({ request, page }) => {
    const nf = await request.get("/this-page-does-not-exist");
    expect(nf.status()).toBe(404);
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByRole("heading", { name: "That page has sold out." })).toBeVisible();

    const sitemap = await (await request.get("/sitemap.xml")).text();
    for (const p of ["/menu", "/book", "/catering", "/contact", "/gallery"]) expect(sitemap).toContain(p);
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/Disallow: \/admin/);
    expect((await request.get("/favicon.ico")).status()).toBe(200);
    expect((await request.get("/uploads/does-not-exist.png")).status()).toBe(404);
    expect((await request.get("/uploads/..%2F..%2Fetc%2Fpasswd")).status()).toBe(404);

    const admin = await request.get("/admin", { maxRedirects: 0 });
    expect(admin.status()).toBe(307);
    expect(admin.headers()["location"]).toContain("/admin/login");
    const forged = await request.get("/admin/menu", { maxRedirects: 0, headers: { cookie: "sm_admin=forged.token.value" } });
    expect(forged.status()).toBe(307);
  });

  test("admin login rejects wrong credentials", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill("owner@smokymug.com");
    await page.getByLabel("Password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Incorrect" })).toHaveText("Incorrect email or password.");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
