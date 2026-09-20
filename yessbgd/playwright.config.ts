import { defineConfig, devices } from "@playwright/test";

/**
 * Visual regression config for hero snapshots.
 *
 * Determinism rules to reduce baseline drift across machines/CI:
 *   • Pin a single Chromium device (Desktop Chrome) and use deviceScaleFactor 1
 *   • Force a stable color scheme + reduced motion + en-US locale
 *   • Lock timezone (UTC) so any date strings render identically
 *   • Disable hinting via Chromium font-render args (in launchOptions)
 *   • Per-test we further inject a font-preload + animation-kill stylesheet
 *
 * Snapshots live under tests/visual/__screenshots__/.
 */
export default defineConfig({
  testDir: "./tests/visual",
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.PREVIEW_URL ?? "http://localhost:3000",
    deviceScaleFactor: 1,
    colorScheme: "light",
    reducedMotion: "reduce",
    locale: "en-US",
    timezoneId: "UTC",
    launchOptions: {
      args: [
        "--font-render-hinting=none",
        "--disable-skia-runtime-opts",
        "--disable-font-subpixel-positioning",
        "--force-color-profile=srgb",
        "--hide-scrollbars",
      ],
    },
  },
  webServer: process.env.PREVIEW_URL
    ? undefined
    : {
        command: "bun run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
