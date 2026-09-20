#!/usr/bin/env node
/**
 * Aggregates the typography + contrast markdown reports into a single
 * payload appended to GitHub Actions' `$GITHUB_STEP_SUMMARY`. Each
 * failing line in the typography report becomes a clickable anchor to
 * the offending file/line on GitHub via $GITHUB_SERVER_URL/$REPO/blob.
 *
 * Run after `npm run check:a11y` (which writes both reports) in CI:
 *   - run: npm run check:a11y || true
 *   - run: node scripts/ci-a11y-summary.mjs
 *
 * Locally, prints to stdout if $GITHUB_STEP_SUMMARY is unset.
 */
import { readFileSync, existsSync, appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const typographyReport = resolve(root, "reports/homepage-typography.md");
const contrastReport = resolve(root, "reports/hero-contrast.md");

const server = process.env.GITHUB_SERVER_URL ?? "https://github.com";
const repo = process.env.GITHUB_REPOSITORY ?? "OWNER/REPO";
const sha = process.env.GITHUB_SHA ?? "main";
const blob = (file, line) => `${server}/${repo}/blob/${sha}/${file}#L${line}`;

const parts = ["# Homepage a11y report", ""];

if (existsSync(typographyReport)) {
  let body = readFileSync(typographyReport, "utf8");
  // Convert "Line N — `prop: \"value\"`" headers into clickable file links.
  body = body.replace(
    /^### Line (\d+) —/gm,
    (_, n) => `### [Line ${n} →](${blob("src/routes/index.tsx", n)}) —`,
  );
  // Linkify table line numbers
  body = body.replace(
    /^\| (\d+) \| `(fontSize|lineHeight|letterSpacing)`/gm,
    (_, n, p) => `| [${n}](${blob("src/routes/index.tsx", n)}) | \`${p}\``,
  );
  parts.push(body, "");
} else {
  parts.push("✅ No typography failures.\n");
}

if (existsSync(contrastReport)) {
  parts.push(readFileSync(contrastReport, "utf8"), "");
} else {
  parts.push("⚠️ Contrast report missing (script did not run).\n");
}

const out = parts.join("\n");
const target = process.env.GITHUB_STEP_SUMMARY;
if (target) {
  appendFileSync(target, out);
  console.log(`Appended a11y summary → ${target}`);
} else {
  process.stdout.write(out);
}
