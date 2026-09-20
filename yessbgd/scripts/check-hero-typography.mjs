#!/usr/bin/env node
/**
 * Hero typography regression guard.
 *
 * Statically inspects the inline `style={{...}}` blocks on the hero
 * `<h1>` headline and `<p>` lede in `src/routes/index.tsx` and asserts:
 *
 *   1. fontSize is a `clamp(min, preferred, max)` with sensible bounds
 *   2. lineHeight is unitless OR a clamp of unitless values (no mixed units)
 *   3. letterSpacing is em-only (no px/vw/rem mixing)
 *   4. wordSpacing is "normal" or omitted (international-script safe)
 *
 * Run via `node scripts/check-hero-typography.mjs`. Designed to be cheap
 * and dependency-free so it can run in CI or before any typography PR.
 *
 * If you intentionally change the hero typography contract, update the
 * BOUNDS and RULES below in the same commit.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = resolve(__dirname, "../src/routes/index.tsx");
const src = readFileSync(file, "utf8");

const failures = [];
const fail = (msg) => failures.push(msg);

/** Pull every inline style={{...}} block as an object-ish text. */
function extractStyleBlock(label, anchor) {
  const idx = src.indexOf(anchor);
  if (idx === -1) return null;
  const styleStart = src.indexOf("style={{", idx);
  if (styleStart === -1) return null;
  // naive brace match
  let depth = 0;
  let i = styleStart + "style={".length;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) break;
    }
  }
  return src.slice(styleStart, i + 2);
}

function getProp(block, prop) {
  const re = new RegExp(`${prop}\\s*:\\s*("([^"]*)"|([0-9.]+))`);
  const m = block.match(re);
  if (!m) return null;
  return m[2] ?? m[3];
}

function assertEmOnlyTracking(label, value) {
  if (value == null) return; // optional
  if (value === "normal") return;
  // Allow simple em values or clamp(em, em, em)
  const emOnly = /^-?\d*\.?\d+em$/;
  const clampEm = /^clamp\(\s*-?\d*\.?\d+em\s*,\s*-?\d*\.?\d+em\s*,\s*-?\d*\.?\d+em\s*\)$/;
  if (!emOnly.test(value) && !clampEm.test(value)) {
    fail(`[${label}] letterSpacing must be em-only (got: ${value}). Mixed units (px/vw + em) cause inconsistent tracking across breakpoints.`);
  }
}

function assertWordSpacing(label, value) {
  if (value == null) return;
  if (value !== "normal" && value !== "0") {
    fail(`[${label}] wordSpacing should be "normal" for international-script parity (got: ${value}).`);
  }
}

function assertLineHeight(label, value) {
  if (value == null) return;
  // Unitless number
  if (/^\d*\.?\d+$/.test(value)) return;
  // clamp of unitless numbers only
  const clampUnitless = /^clamp\(\s*\d*\.?\d+\s*,\s*[\d.+\-vweh\s]+\s*,\s*\d*\.?\d+\s*\)$/;
  if (clampUnitless.test(value)) {
    // Reject mixed em+vw in middle expression (still invalid math)
    if (/em/.test(value)) {
      fail(`[${label}] lineHeight clamp uses em — keep it unitless to scale with font-size predictably (got: ${value}).`);
    }
    return;
  }
  fail(`[${label}] lineHeight should be unitless (got: ${value}).`);
}

function assertFontSizeClamp(label, value) {
  if (value == null) return fail(`[${label}] missing fontSize`);
  const m = value.match(/^clamp\(\s*([\d.]+)rem\s*,\s*[^,]+,\s*([\d.]+)rem\s*\)$/);
  if (!m) return fail(`[${label}] fontSize must be clamp(rem, expr, rem) (got: ${value})`);
  const min = parseFloat(m[1]);
  const max = parseFloat(m[2]);
  if (max <= min) fail(`[${label}] fontSize clamp max (${max}rem) must exceed min (${min}rem).`);
  // Sanity: don't let desktop ceiling exceed an editorial maximum
  if (label === "h1" && max > 4) fail(`[${label}] fontSize ceiling ${max}rem is too large for editorial balance (max 4rem).`);
  if (label === "lede" && max > 1.25) fail(`[${label}] lede fontSize ceiling ${max}rem is too large (max 1.25rem).`);
}

const h1Block = extractStyleBlock("h1", "ref={headlineRef}");
const ledeBlock = extractStyleBlock("lede", "Lede paragraph");

if (!h1Block) fail("Could not find hero <h1> style block");
if (!ledeBlock) fail("Could not find hero <p> lede style block");

if (h1Block) {
  assertFontSizeClamp("h1", getProp(h1Block, "fontSize"));
  assertLineHeight("h1", getProp(h1Block, "lineHeight"));
  assertEmOnlyTracking("h1", getProp(h1Block, "letterSpacing"));
  assertWordSpacing("h1", getProp(h1Block, "wordSpacing"));
}
if (ledeBlock) {
  assertFontSizeClamp("lede", getProp(ledeBlock, "fontSize"));
  assertLineHeight("lede", getProp(ledeBlock, "lineHeight"));
  assertEmOnlyTracking("lede", getProp(ledeBlock, "letterSpacing"));
  assertWordSpacing("lede", getProp(ledeBlock, "wordSpacing"));
}

if (failures.length) {
  console.error("\n✗ Hero typography regression detected:\n");
  for (const f of failures) console.error("  • " + f);
  console.error("\nReview src/routes/index.tsx hero <h1> / <p> style blocks, or update the contract in scripts/check-hero-typography.mjs.\n");
  process.exit(1);
}

console.log("✓ Hero typography invariants OK (fontSize, lineHeight, letterSpacing, wordSpacing).");
