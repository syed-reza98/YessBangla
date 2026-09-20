/**
 * Download cards (EN/BN) responsive overflow checks.
 *
 * Verifies that:
 *   • Both EN and BN cards render side-by-side at all breakpoints
 *   • The version/meta strings inside the BN card and the BN gate
 *     dialog do not overflow their container at mobile/desktop widths
 *   • The Bangla `versionLabel` renders the expected literal string
 *
 * No baselines — uses bounding-box assertions so it stays stable
 * across machines and font versions.
 */
import { test, expect, type Page } from "@playwright/test";

const VIEWPORTS = [
  { name: "mobile-narrow", width: 360, height: 800 },
  { name: "mobile",        width: 390, height: 844 },
  { name: "tablet",        width: 820, height: 1180 },
  { name: "desktop",       width: 1440, height: 900 },
] as const;

const BN_VERSION = "v১.২ · ০৯ মে ২০২৬";
const BN_META = "১৭ পৃষ্ঠা · A4 PDF · নোটো সান্স বাংলা";

async function gotoHome(page: Page, lang: "en" | "bn") {
  await page.addInitScript((l) => {
    try { window.localStorage.setItem("i18nextLng", l); } catch {}
  }, lang);
  await page.goto("/");
  await page.waitForLoadState("networkidle");
}

async function assertNoHorizontalOverflow(page: Page, selector: string) {
  const handle = page.locator(selector).first();
  await expect(handle).toBeVisible();
  const overflow = await handle.evaluate((el) => {
    const node = el as HTMLElement;
    return node.scrollWidth - node.clientWidth;
  });
  expect(overflow, `${selector} should not overflow horizontally`).toBeLessThanOrEqual(1);
}

for (const vp of VIEWPORTS) {
  test.describe(`download cards @ ${vp.name} (${vp.width}x${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("EN + BN cards visible side-by-side without overflow", async ({ page }) => {
      await gotoHome(page, "en");
      const enCard = page.locator('button[lang="en"]').first();
      const bnCard = page.locator('button[lang="bn"]').first();
      await expect(enCard).toBeVisible();
      await expect(bnCard).toBeVisible();

      // Side-by-side: EN's right edge ≤ BN's left edge
      const a = await enCard.boundingBox();
      const b = await bnCard.boundingBox();
      expect(a && b).toBeTruthy();
      expect(a!.x + a!.width).toBeLessThanOrEqual(b!.x + 1);

      await assertNoHorizontalOverflow(page, 'button[lang="en"]');
      await assertNoHorizontalOverflow(page, 'button[lang="bn"]');
    });

    test("BN gate dialog renders versionLabel + metaLabel without overflow", async ({ page }) => {
      await gotoHome(page, "bn");
      await page.locator('button[lang="bn"]').first().scrollIntoViewIfNeeded();
      await page.locator('button[lang="bn"]').first().click();

      const dialog = page.locator('[role="dialog"][lang="bn"]');
      await expect(dialog).toBeVisible();

      // Confirm-step shows the exact Bangla version + meta strings.
      await expect(dialog).toContainText(BN_VERSION);
      await expect(dialog).toContainText(BN_META);

      // Dialog itself must not overflow horizontally on this viewport.
      await assertNoHorizontalOverflow(page, '[role="dialog"][lang="bn"]');
    });
  });
}
