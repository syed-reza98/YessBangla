/**
 * Hero visual regression — sub-section + interactive-state snapshots.
 *
 * Captures pixel snapshots of distinct hero sub-regions at three
 * canonical breakpoints, plus keyboard-focus states for the two CTAs
 * so a regression in :focus-visible styling surfaces immediately.
 *
 * Determinism (see playwright.config.ts):
 *   • Pinned Desktop Chrome + dpr 1 + UTC + en-US + reduced motion
 *   • Per-test `prepareHero()` injects a stylesheet that:
 *       – forces the hero background to a flat known token color
 *         (`bg-foreground`) instead of the photographic image, and
 *       – disables every animation/transition, and
 *       – preloads display + sans webfonts and waits for `document.fonts.ready`
 *
 * Stable selectors (data-testid):
 *   hero-headline, hero-lede, hero-buttons, hero-trust-area,
 *   hero-trust-row, hero-trust-divider, hero-trust-list
 *
 * Run:
 *   bunx playwright install chromium
 *   bunx playwright test tests/visual
 *   bunx playwright test tests/visual --update-snapshots
 */
import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.PREVIEW_URL ?? "http://localhost:3000";

const VIEWPORTS = [
  { name: "mobile",  width: 390,  height: 844  },
  { name: "tablet",  width: 820,  height: 1180 },
  { name: "desktop", width: 1440, height: 900  },
] as const;

const TARGETS = [
  { id: "hero-section",       selector: "section.hero-section" },
  { id: "hero-headline",      selector: '[data-testid="hero-headline"]' },
  { id: "hero-lede",          selector: '[data-testid="hero-lede"]' },
  { id: "hero-buttons",       selector: '[data-testid="hero-buttons"]' },
  { id: "hero-trust-area",    selector: '[data-testid="hero-trust-area"]' },
  { id: "hero-trust-row",     selector: '[data-testid="hero-trust-row"]' },
  { id: "hero-trust-divider", selector: '[data-testid="hero-trust-divider"]' },
  { id: "hero-trust-list",    selector: '[data-testid="hero-trust-list"]' },
] as const;

/**
 * Inject a deterministic "test mode" stylesheet + wait for fonts.
 * Keeps baselines stable across machines and CI runners.
 */
async function prepareHero(page: Page) {
  await page.addStyleTag({
    content: `
      /* Kill every animation and transition to avoid mid-frame diffs */
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
      /* Force a flat hero background (token-driven) so we never diff against
         the JPEG hero photograph — those bytes vary by decoder. */
      .hero-section img,
      .hero-section [class*="hero-overlay"],
      .hero-section [class*="hero-halo"] {
        display: none !important;
      }
      .hero-section { background: var(--foreground) !important; }
    `,
  });
  // Preload + wait for our display + sans webfonts so antialiasing is stable.
  await page.evaluate(async () => {
    const families = ["SF Pro Display", "Inter"];
    await Promise.all(
      families.flatMap((f) => [
        (document as any).fonts.load(`600 32px "${f}"`),
        (document as any).fonts.load(`400 16px "${f}"`),
      ]),
    );
    await (document as any).fonts.ready;
  });
}

for (const vp of VIEWPORTS) {
  test.describe(`hero @ ${vp.name} (${vp.width}×${vp.height})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(BASE_URL, { waitUntil: "networkidle" });
      await prepareHero(page);
      await page.waitForLoadState("networkidle");
    });

    for (const target of TARGETS) {
      test(`${target.id}`, async ({ page }) => {
        const el = page.locator(target.selector).first();

        if (target.id === "hero-trust-divider" && vp.name === "mobile") {
          await expect(el).toBeHidden();
          return;
        }

        await expect(el).toBeVisible();
        await expect(el).toHaveScreenshot(`${target.id}-${vp.name}.png`, {
          maxDiffPixelRatio: 0.01,
          animations: "disabled",
          caret: "hide",
        });
      });
    }

    /* ---------- Interactive states ---------- */
    // Tab from <body> until focus lands on the primary CTA, snap, then tab once
    // more for the secondary CTA. Verifies focus-visible ring tokens don't drift.
    test("hero-buttons :focus-visible (primary CTA)", async ({ page }) => {
      const buttons = page.locator('[data-testid="hero-buttons"]');
      await expect(buttons).toBeVisible();
      // Reset focus to body, then Tab through the document until the first
      // hero CTA is focused. Cap iterations defensively.
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
      const primary = buttons.locator("a").first();
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press("Tab");
        if (await primary.evaluate((el) => el === document.activeElement)) break;
      }
      await expect(primary).toBeFocused();
      await expect(buttons).toHaveScreenshot(`hero-buttons-focus-primary-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
        animations: "disabled",
        caret: "hide",
      });
    });

    test("hero-buttons :focus-visible (secondary CTA)", async ({ page }) => {
      const buttons = page.locator('[data-testid="hero-buttons"]');
      await expect(buttons).toBeVisible();
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
      const secondary = buttons.locator("a").nth(1);
      for (let i = 0; i < 31; i++) {
        await page.keyboard.press("Tab");
        if (await secondary.evaluate((el) => el === document.activeElement)) break;
      }
      await expect(secondary).toBeFocused();
      await expect(buttons).toHaveScreenshot(`hero-buttons-focus-secondary-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
        animations: "disabled",
        caret: "hide",
      });
    });

    test("hero-buttons :hover (primary CTA)", async ({ page }) => {
      const buttons = page.locator('[data-testid="hero-buttons"]');
      await buttons.locator("a").first().hover();
      await expect(buttons).toHaveScreenshot(`hero-buttons-hover-primary-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
        animations: "disabled",
        caret: "hide",
      });
    });
  });
}
