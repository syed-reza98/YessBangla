#!/usr/bin/env node
/**
 * Hero a11y contrast guard.
 *
 * Reads color tokens from `src/styles.css` and verifies the hero
 * headline + lede + overlay text combinations meet WCAG AA contrast
 * ratios (≥4.5:1 for body text, ≥3:1 for large text ≥18pt/24px or
 * ≥14pt/18.66px bold) against both the light (`:root`) and dark
 * (`.dark`) themes — and against the dark hero background which the
 * homepage uses (`bg-foreground` + `text-background`).
 *
 * Run via `node scripts/check-hero-contrast.mjs`.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cssPath = resolve(__dirname, "../src/styles.css");
const css = readFileSync(cssPath, "utf8");

/* ---------- token extraction ---------- */
function extractScope(scopeRe) {
  const m = css.match(scopeRe);
  if (!m) return {};
  const body = m[1];
  const tokens = {};
  const re = /--([\w-]+)\s*:\s*(oklch\([^)]+\))/g;
  let t;
  while ((t = re.exec(body)) !== null) tokens[t[1]] = t[2];
  return tokens;
}
const lightTokens = extractScope(/:root\s*\{([\s\S]*?)\n\}/);
const darkTokens = extractScope(/\.dark\s*\{([\s\S]*?)\n\}/);

/* ---------- color math ---------- */
// oklch → sRGB → relative luminance (WCAG)
function parseOklch(str) {
  const m = str.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (!m) return null;
  return { L: +m[1], C: +m[2], h: +m[3] };
}
// Minimal Oklab → linear sRGB conversion (Björn Ottosson)
function oklchToLinearRgb({ L, C, h }) {
  const hr = (h * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}
function relLum(linRgb) {
  const f = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
  // For luminance we use linear values directly (Y per Rec.709)
  const [r, g, b] = linRgb.map((v) => Math.max(0, Math.min(1, v)));
  void f; // sRGB encoding not needed for luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(fgOklch, bgOklch) {
  const L1 = relLum(oklchToLinearRgb(parseOklch(fgOklch)));
  const L2 = relLum(oklchToLinearRgb(parseOklch(bgOklch)));
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

/* ---------- alpha-composite helpers (for translucent text) ---------- */
function alphaCompositeLin(fgOklch, bgOklch, alpha) {
  const fg = oklchToLinearRgb(parseOklch(fgOklch));
  const bg = oklchToLinearRgb(parseOklch(bgOklch));
  return fg.map((c, i) => c * alpha + bg[i] * (1 - alpha));
}
function contrastLinear(fgLin, bgLin) {
  const L1 = relLum(fgLin);
  const L2 = relLum(bgLin);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

/* ---------- combinations to test ---------- */
// On the homepage hero, the section has bg-foreground + text-background
// so the "background" surface is --foreground and the text is --background.
const checks = [
  { label: "Hero headline (light surface)",        fg: "background", bg: "foreground", tokens: lightTokens, min: 3 },
  { label: "Hero lede (light surface)",            fg: "background", bg: "foreground", tokens: lightTokens, min: 4.5 },
  { label: "Hero headline (dark surface)",         fg: "background", bg: "foreground", tokens: darkTokens,  min: 3 },
  { label: "Hero lede (dark surface)",             fg: "background", bg: "foreground", tokens: darkTokens,  min: 4.5 },
  { label: "Accent on hero surface (light)",       fg: "accent",     bg: "foreground", tokens: lightTokens, min: 3 },
  { label: "Accent on hero surface (dark)",        fg: "accent",     bg: "foreground", tokens: darkTokens,  min: 3 },
  { label: "Primary CTA text (light)",             fg: "foreground", bg: "background", tokens: lightTokens, min: 4.5 },
  { label: "Primary CTA text (dark)",              fg: "foreground", bg: "background", tokens: darkTokens,  min: 4.5 },
  // Note: hero CTAs use bg-background (not bg-accent), so accent-on-accent
  // contrast isn't exercised here — covered by site-wide checks elsewhere.
  // Trust signals — labels render text-background/85, eyebrow text-background/70.
  { label: "Trust label /85 on hero (light)",      fg: "background", bg: "foreground", alpha: 0.85, tokens: lightTokens, min: 4.5 },
  { label: "Trust label /85 on hero (dark)",       fg: "background", bg: "foreground", alpha: 0.85, tokens: darkTokens,  min: 4.5 },
  { label: "Trust eyebrow /75 on hero (light)",    fg: "background", bg: "foreground", alpha: 0.75, tokens: lightTokens, min: 3 },
  { label: "Trust eyebrow /75 on hero (dark)",     fg: "background", bg: "foreground", alpha: 0.75, tokens: darkTokens,  min: 3 },
  // Trust icon glyphs (text-accent on hero surface)
  { label: "Trust icon (accent) on hero (light)",  fg: "accent", bg: "foreground", tokens: lightTokens, min: 3 },
  { label: "Trust icon (accent) on hero (dark)",   fg: "accent", bg: "foreground", tokens: darkTokens,  min: 3 },
];

const failures = [];
const rows = [];
for (const c of checks) {
  const fg = c.tokens[c.fg];
  const bg = c.tokens[c.bg];
  if (!fg || !bg) {
    failures.push({ label: c.label, msg: `Missing token (fg=${c.fg}, bg=${c.bg})` });
    continue;
  }
  let ratio;
  if (c.alpha != null) {
    ratio = contrastLinear(alphaCompositeLin(fg, bg, c.alpha), oklchToLinearRgb(parseOklch(bg)));
  } else {
    ratio = contrast(fg, bg);
  }
  const pass = ratio >= c.min;
  rows.push({ ...c, ratio, pass });
  if (!pass) failures.push({ label: c.label, msg: `${ratio.toFixed(2)}:1 (needs ≥ ${c.min}:1)` });
}

console.log("Hero contrast report (WCAG AA)\n");
console.log("Combination".padEnd(46), "Ratio".padEnd(9), "Min", "Result");
for (const r of rows) {
  console.log(
    r.label.padEnd(46),
    `${r.ratio.toFixed(2)}:1`.padEnd(9),
    String(r.min).padEnd(4),
    r.pass ? "✓" : "✗",
  );
}

/* ---------- markdown report (for CI job summary) ---------- */
import { writeFileSync, mkdirSync } from "node:fs";
const reportPath = resolve(__dirname, "../reports/hero-contrast.md");
mkdirSync(dirname(reportPath), { recursive: true });
const md = [
  "# Hero contrast report (WCAG AA)",
  "",
  `**Source tokens:** \`src/styles.css\``,
  `**Failures:** ${failures.length}`,
  "",
  "| Combination | Ratio | Min | Result |",
  "| --- | ---: | ---: | :---: |",
  ...rows.map((r) => `| ${r.label} | ${r.ratio.toFixed(2)}:1 | ${r.min} | ${r.pass ? "✓" : "✗"} |`),
  ...(failures.length
    ? ["", "## Failures", "", ...failures.map((f) => `- **${f.label}** — ${f.msg}`)]
    : []),
  "",
].join("\n");
writeFileSync(reportPath, md, "utf8");

if (failures.length) {
  console.error("\n✗ WCAG AA contrast failures:\n");
  for (const f of failures) console.error(`  • ${f.label}: ${f.msg}`);
  console.error(
    `\nReport: ${reportPath}\nAdjust offending tokens in src/styles.css (\`:root\` light, \`.dark\` dark).\n`,
  );
  process.exit(1);
}
console.log(`\n✓ All hero text/overlay combinations meet WCAG AA. Report: ${reportPath}`);
