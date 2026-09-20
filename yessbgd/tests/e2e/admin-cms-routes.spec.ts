import { test, expect, type Page } from "@playwright/test";

/**
 * Verifies that every Admin CMS "Manage" / "Edit" action actually mounts its
 * child route (regression guard for missing <Outlet /> in layout routes),
 * that a loading state is shown while content is fetched, and that the
 * sidebar highlights the active CMS section.
 */

const TYPES = ["ventures", "services", "industries", "insights"] as const;

async function signIn(page: Page) {
  const storageKey = process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY;
  const sessionJson = process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON;
  test.skip(!storageKey || !sessionJson, "No admin session in env — skipping admin e2e.");
  await page.goto("/");
  await page.evaluate(
    ([k, v]) => window.localStorage.setItem(k as string, v as string),
    [storageKey!, sessionJson!],
  );
}

test.describe("Admin CMS navigation", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("CMS hub lists every content type with a Manage action", async ({ page }) => {
    await page.goto("/admin/cms");
    await expect(page.getByRole("heading", { name: /content management/i })).toBeVisible();
    const manage = page.getByText("Manage", { exact: true });
    expect(await manage.count()).toBeGreaterThanOrEqual(TYPES.length);
  });

  for (const type of TYPES) {
    test(`Manage → /admin/cms/${type} mounts the list child route`, async ({ page }) => {
      await page.goto("/admin/cms");
      await page.locator(`a[href="/admin/cms/${type}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`/admin/cms/${type}$`));

      // Child route mounted: the list toolbar is present.
      await expect(page.getByPlaceholder("Filter…")).toBeVisible();
      await expect(page.getByRole("main").getByRole("link", { name: /^All content$/ })).toBeVisible();

      // Sidebar highlights the active CMS section.
      const activeLeaf = page.locator(`aside a[href="/admin/cms/${type}"][data-active="true"]`);
      await expect(activeLeaf.first()).toHaveAttribute("aria-current", "page");

      // Body is not blank.
      const body = (await page.locator("main, body").first().innerText()).trim();
      expect(body.length).toBeGreaterThan(20);
    });

    test(`New/Edit → /admin/cms/${type}/:id mounts the editor child route`, async ({ page }) => {
      await page.goto(`/admin/cms/${type}`);
      await expect(page.getByPlaceholder("Filter…")).toBeVisible();

      const editLink = page.locator(`a[href^="/admin/cms/${type}/"]`).last();
      await editLink.click();
      await expect(page).toHaveURL(new RegExp(`/admin/cms/${type}/[^/]+$`));

      // Editor mounted: form controls + back link exist.
      await expect(page.getByRole("main").getByRole("link", { name: /Back to list/i })).toBeVisible();
      await expect(page.locator("form")).toBeVisible();

      // Sidebar still marks the same CMS section active.
      await expect(
        page.locator(`aside a[href="/admin/cms/${type}"][data-active="true"]`).first(),
      ).toBeVisible();
    });
  }

  test("a loading state is rendered before CMS list content appears", async ({ page }) => {
    // Slow the Supabase read so the pending/skeleton UI is observable.
    await page.route("**/rest/v1/cms_ventures*", async (route) => {
      await new Promise((r) => setTimeout(r, 1200));
      await route.continue();
    });
    await page.goto("/admin/cms/ventures");
    await expect(page.getByTestId("admin-loading").first()).toBeVisible();
    await expect(page.getByTestId("admin-loading")).toHaveCount(0, { timeout: 15_000 });
  });
});
