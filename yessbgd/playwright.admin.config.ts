import { defineConfig, devices } from "@playwright/test";

/**
 * Admin end-to-end checks (route mounting, loading states, sidebar highlight).
 * Requires a signed-in Supabase session provided through env vars:
 *   LOVABLE_BROWSER_SUPABASE_STORAGE_KEY + LOVABLE_BROWSER_SUPABASE_SESSION_JSON
 * Run with: bun run test:admin
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  retries: 0,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.PREVIEW_URL ?? "http://localhost:8080",
    viewport: { width: 1440, height: 1000 },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {},
  },
});
