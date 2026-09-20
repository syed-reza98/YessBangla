#!/usr/bin/env node
/**
 * Homepage typography token guard (with detailed markdown report).
 *
 * Scans `src/routes/index.tsx` for inline style declarations of
 * `fontSize`, `lineHeight`, or `letterSpacing` and asserts that they
 * either:
 *   • use a CSS variable token (var(--text-*), var(--hero-rhythm-*)), OR
 *   • use a clamp()-based fluid expression, OR
 *   • are a unitless line-height / em-only tracking / "normal".
 *
 * On failure, writes a markdown report with each offending line and a
 * recommended token replacement to `reports/homepage-typography.md`.
 *
 * Run via `node scripts/check-homepage-typography.mjs`.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = resolve(__dirname, "../src/routes/index.tsx");
const reportPath = resolve(__dirname, "../reports/homepage-typography.md");
const src = readFileSync(file, "utf8");
const lines = src.split("\n");

const PROPS = ["fontSize", "lineHeight", "letterSpacing"];

/** Map a hard-coded value to a recommended design token. */
function recommendToken(prop, value) {
  const px = value.match(/^(\d*\.?\d+)px$/);
  const rem = value.match(/^(\d*\.?\d+)rem$/);
  const num = px ? parseFloat(px[1]) / 16 : rem ? parseFloat(rem[1]) : null;

  if (prop === "fontSize") {
    if (num == null) return "wrap in clamp(minRem, fluidExpr, maxRem) or use var(--text-*)";
    if (num <= 0.78) return "var(--text-xs)";
    if (num <= 0.9) return "var(--text-sm)";
    if (num <= 1.05) return "var(--text-base)";
    if (num <= 1.2) return "var(--text-lg)";
    if (num <= 1.4) return "var(--text-xl)";
    if (num <= 1.8) return "var(--text-2xl)";
    if (num <= 2.4) return "var(--text-3xl)";
    return "clamp(rem, fluidExpr, rem) — exceed token scale";
  }
  if (prop === "lineHeight") {
    return "use a unitless ratio (e.g. 1.5) or clamp(ratio, expr, ratio)";
  }
  if (prop === "letterSpacing") {
    return "use em units (e.g. -0.01em) or var(--tracking-*)";
  }
  return "use a design token";
}

const failures = [];

for (const prop of PROPS) {
  const re = new RegExp(`${prop}\\s*:\\s*"([^"]+)"`, "g");
  let m;
  while ((m = re.exec(src)) !== null) {
    const value = m[1].trim();
    const lineNo = src.slice(0, m.index).split("\n").length;

    const isToken = /var\(--/.test(value);
    const isClamp = /^clamp\(/.test(value);
    const isEmOnly = prop === "letterSpacing" && /^-?\d*\.?\d+em$/.test(value);
    const isUnitlessLh = prop === "lineHeight" && /^\d*\.?\d+$/.test(value);
    const isNormal = value === "normal";

    if (isToken || isClamp || isEmOnly || isUnitlessLh || isNormal) continue;

    failures.push({
      lineNo,
      prop,
      value,
      snippet: lines[lineNo - 1]?.trim() ?? "",
      recommendation: recommendToken(prop, value),
    });
  }
}

if (failures.length) {
  // Build a markdown report
  const md = [
    "# Homepage typography report",
    "",
    `**File:** \`src/routes/index.tsx\``,
    `**Failures:** ${failures.length}`,
    "",
    "| Line | Property | Current value | Recommended replacement |",
    "| ---: | -------- | ------------- | ----------------------- |",
    ...failures.map(
      (f) =>
        `| ${f.lineNo} | \`${f.prop}\` | \`${f.value}\` | ${f.recommendation} |`,
    ),
    "",
    "## Context",
    "",
    ...failures.flatMap((f) => [
      `### Line ${f.lineNo} — \`${f.prop}: "${f.value}"\``,
      "",
      "```tsx",
      f.snippet,
      "```",
      `**Replace with:** ${f.recommendation}`,
      "",
    ]),
  ].join("\n");

  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, md, "utf8");

  console.error("\n✗ Hard-coded typography detected on homepage:\n");
  for (const f of failures) {
    console.error(
      `  • [line ${f.lineNo}] ${f.prop}: "${f.value}" → ${f.recommendation}`,
    );
  }
  console.error(`\nDetailed report written to: ${reportPath}\n`);
  process.exit(1);
}

console.log(
  "✓ Homepage typography uses design tokens (no hard-coded fontSize/lineHeight/letterSpacing).",
);
