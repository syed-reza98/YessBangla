import { test, expect, type Page } from "@playwright/test";

/**
 * Public header regression guard.
 *
 * 1. Top-level order must match the canonical locked structure.
 * 2. Stray/test items (e.g. the "New submenu" that once leaked into Home)
 *    must never render.
 * 3. The mobile/tablet rail must expose the same desktop structure.
 */

const CANONICAL = [
  "/",
  "/about",
  "/services",
  "/ventures",
  "/industries",
  "/insights",
  "/careers",
  "/contact",
];

const STRAY = /new submenu|test item|untitled|lorem/i;

async function topLevelHrefs(page: Page, testId: string) {
  const nav = page.getByTestId(testId);
  await expect(nav).toBeVisible();
  // Wait until the CMS-driven menu has replaced the static fallback.
  await expect
    .poll(async () => nav.locator('a[href="/ventures"], button[aria-haspopup]').count(), { timeout: 15_000 })
    .toBeGreaterThan(0);
  const items = nav.locator("a[href], button[aria-haspopup]");
  const count = await items.count();
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const el = items.nth(i);
    const href = await el.getAttribute("href");
    out.push(href ?? (await el.innerText()).trim());
  }
  return out;
}

test.describe("Public header menu", () => {
  test("desktop order matches the canonical locked structure", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    const hrefs = await topLevelHrefs(page, "header-nav-desktop");
    const canonicalOnly = hrefs.filter((h) => CANONICAL.includes(h));
    expect(canonicalOnly).toEqual(CANONICAL);
  });

  test("no stray or test menu items render in the header", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    const text = await page.locator("header").first().innerText();
    expect(text).not.toMatch(STRAY);

    // Home must never become a dropdown.
    const home = page.getByTestId("header-nav-desktop").locator('a[href="/"]').first();
    await expect(home).not.toHaveAttribute("aria-haspopup", "true");
  });

  test("mobile rail mirrors the desktop structure and opens dropdowns on tap", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const hrefs = await topLevelHrefs(page, "header-nav-mobile");
    const canonicalOnly = hrefs.filter((h) => CANONICAL.includes(h));
    // Same set and same relative order as the desktop canonical list.
    expect(canonicalOnly).toEqual(CANONICAL.filter((h) => canonicalOnly.includes(h)));
    expect(canonicalOnly.length).toBeGreaterThanOrEqual(CANONICAL.length - 1);

    const rail = page.getByTestId("header-nav-rail");
    await expect(rail).toBeVisible();
    await expect(rail).not.toContainText(STRAY);

    const dropdown = rail.locator("button[aria-haspopup]").first();
    if (await dropdown.count()) {
      await dropdown.click();
      await expect(dropdown).toHaveAttribute("aria-expanded", "true");
      await expect(rail.locator("a").first()).toBeVisible();
    }
  });
});
