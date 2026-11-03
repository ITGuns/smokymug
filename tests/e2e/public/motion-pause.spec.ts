import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * The header pause/resume toggle must never re-mount page content. Reveal and
 * SplitText used to swap their motion element for a plain one when motion was
 * reduced, so pressing the toggle threw the whole subtree away: a typed form value
 * was lost and the home gallery marquee jumped back to its start (found 4 Nov).
 * These tests pin node identity and state across the toggle, and the contract that
 * paused or reduced-motion visitors see reveals at once (the [data-reveal] CSS pin
 * in globals.css, not a different element).
 */

type StashWindow = Window & { __stash?: Record<string, Element> };

async function stash(locator: Locator, key: string) {
  await locator.evaluate((el, k) => {
    const w = window as StashWindow;
    w.__stash = { ...(w.__stash ?? {}), [k]: el };
  }, key);
}

/** True when the locator still resolves to the very node stashed under `key`. */
async function sameNode(locator: Locator, key: string) {
  return locator.evaluate((el, k) => (window as StashWindow).__stash?.[k] === el && el.isConnected, key);
}

/** Desktop keeps the toggle in the utility strip, which collapses (inert) once the page scrolls. */
async function toggleMotion(page: Page, name: "Pause animations" | "Resume animations") {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.getByRole("button", { name }).click();
  const pausing = name === "Pause animations";
  await expect(page.getByRole("button", { name: pausing ? "Resume animations" : "Pause animations" })).toHaveAttribute("aria-pressed", String(pausing));
  await expect(page.locator("html")).toHaveAttribute("data-motion", pausing ? "paused" : "");
}

function translateX(track: Locator) {
  return track.evaluate((el) => {
    const t = getComputedStyle(el).transform;
    return t === "none" ? 0 : new DOMMatrixReadOnly(t).m41;
  });
}

function revealStyle(reveal: Locator) {
  return reveal.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { opacity: cs.opacity, transform: cs.transform, filter: cs.filter };
  });
}

/** [data-reveal] elements on the page that do not compute as fully shown right now. */
function notShown(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("[data-reveal]")]
      .filter((el) => {
        const cs = getComputedStyle(el);
        return cs.opacity !== "1" || cs.transform !== "none" || cs.filter !== "none";
      })
      .map((el) => (el.textContent ?? "").trim().slice(0, 40)),
  );
}

test.describe("Motion pause toggle", () => {
  test.beforeEach(async ({ page }) => {
    // Same result whatever the animation setting of the machine running the suite.
    await page.emulateMedia({ reducedMotion: "no-preference" });
  });

  test("pause and resume keep a typed catering inquiry (no re-mount)", async ({ page }) => {
    await page.goto("/catering");
    const name = page.getByLabel(/^Your name/);
    await name.fill("QA keeps this");
    await stash(name, "name");

    await toggleMotion(page, "Pause animations");
    expect(await sameNode(name, "name")).toBe(true);
    await expect(name).toHaveValue("QA keeps this");

    await toggleMotion(page, "Resume animations");
    expect(await sameNode(name, "name")).toBe(true);
    await expect(name).toHaveValue("QA keeps this");
  });

  test("pause and resume keep the home motion pieces mounted and the marquee in place", async ({ page }) => {
    await page.goto("/");
    const gallery = page.locator("section", { has: page.getByRole("heading", { name: "Gallery", exact: true }) });
    const track = gallery.locator("div.cursor-grab");
    const pieces: Record<string, Locator> = {
      track,
      marqueeReveal: track.locator("xpath=ancestor::*[@data-reveal][1]"),
      heroHeading: page.getByRole("heading", { level: 1 }), // SplitText
      heroWord: page.getByRole("heading", { level: 1 }).locator("span.overflow-hidden > span").first(),
      carousel: page.locator('[aria-roledescription="carousel"]').first(), // ImageCarousel
      parallax: page.locator('[class*="-inset-y-"]').first(), // ParallaxImage inner layer
    };
    for (const [key, loc] of Object.entries(pieces)) await stash(loc, key);
    const allSame = async () => Object.fromEntries(await Promise.all(Object.entries(pieces).map(async ([k, loc]) => [k, await sameNode(loc, k)] as const)));
    const expected = Object.fromEntries(Object.keys(pieces).map((k) => [k, true]));

    // Running: the marquee has travelled away from its start
    await expect.poll(() => translateX(track)).toBeLessThan(-10);

    await toggleMotion(page, "Pause animations");
    expect(await allSame()).toEqual(expected);
    const paused = await translateX(track);
    expect(paused).toBeLessThan(-10); // did not jump back to its start
    await page.waitForTimeout(800);
    expect(await translateX(track)).toBe(paused); // frozen

    await toggleMotion(page, "Resume animations");
    expect(await allSame()).toEqual(expected);
    // Moves on from where it stopped instead of restarting at 0
    await expect.poll(() => translateX(track)).toBeLessThan(paused);
    expect(await translateX(track)).toBeGreaterThan(paused - 300);
  });

  test("paused visitors get every reveal shown at once, with no fade", async ({ page }) => {
    await page.goto("/catering");
    await toggleMotion(page, "Pause animations");
    // Straight after the click, below-fold ones included (the catering cards carry
    // transition-all, which used to ease them into the pin over 500ms)
    expect(await notShown(page)).toEqual([]);
    const eyebrow = page.getByText("Plan your event", { exact: true });
    await eyebrow.scrollIntoViewIfNeeded();
    // Read straight away: a whileInView fade that was not pinned would still be near opacity 0
    expect(await revealStyle(eyebrow.locator("xpath=ancestor::*[@data-reveal][1]"))).toEqual({ opacity: "1", transform: "none", filter: "none" });
  });

  test("reduced-motion visitors get every reveal shown at once, with no fade", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/catering");
    expect(await notShown(page)).toEqual([]);
    const eyebrow = page.getByText("Plan your event", { exact: true });
    await eyebrow.scrollIntoViewIfNeeded();
    // motion's reducedMotion makes transforms instant but never opacity, so the pin has to hold it
    expect(await revealStyle(eyebrow.locator("xpath=ancestor::*[@data-reveal][1]"))).toEqual({ opacity: "1", transform: "none", filter: "none" });
  });
});
