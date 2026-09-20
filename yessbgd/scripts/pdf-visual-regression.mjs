// Visual regression for generated PDFs.
//
// For every (format × orientation) combination, build the brief, render
// every page to PNG via pdftoppm, and compare to a pixel baseline. Crops
// three branding regions (letterhead band, center watermark, footer)
// before comparing so layout-stable chrome is regression-tested
// independently from body text rewraps.
//
// Run: bun scripts/pdf-visual-regression.mjs
//      bun scripts/pdf-visual-regression.mjs --update    (refresh baseline)

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { JSDOM } from "jsdom";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const dom = new JSDOM("", { url: "http://localhost/" });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.navigator = dom.window.navigator;
globalThis.HTMLCanvasElement = dom.window.HTMLCanvasElement;
globalThis.Image = dom.window.Image;
globalThis.FileReader = dom.window.FileReader;
globalThis.fetch = async () => {
  const buf = fs.readFileSync(path.resolve("src/assets/yess-bangla-logo.jpeg"));
  return { blob: async () => new dom.window.Blob([buf], { type: "image/jpeg" }) };
};

const update = process.argv.includes("--update");

const { ventures } = await import("../src/data/ventures.ts");
const { buildVentureBriefDoc } = await import("../src/lib/ventureBrief.ts");

const v = ventures[0];
const baselineDir = path.resolve("tests/visual/__pdf_baselines__");
const outDir = path.resolve("tests/visual/__pdf_output__");
const diffDir = path.resolve("tests/visual/__pdf_diffs__");
fs.mkdirSync(baselineDir, { recursive: true });
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.rmSync(diffDir, { recursive: true, force: true });
fs.mkdirSync(diffDir, { recursive: true });

const matrix = [
  { format: "a4", orientation: "portrait" },
  { format: "a4", orientation: "landscape" },
  { format: "letter", orientation: "portrait" },
  { format: "letter", orientation: "landscape" },
];

// Region crops are expressed as fractions of page width/height.
const REGIONS = {
  letterhead: { x: 0, y: 0, w: 1, h: 0.13 },
  watermark: { x: 0.2, y: 0.3, w: 0.6, h: 0.4 },
  footer: { x: 0, y: 0.9, w: 1, h: 0.1 },
};

function cropPng(src, region) {
  const sx = Math.max(0, Math.min(src.width - 1, Math.round(src.width * region.x)));
  const sy = Math.max(0, Math.min(src.height - 1, Math.round(src.height * region.y)));
  const w = Math.max(1, Math.min(src.width - sx, Math.round(src.width * region.w)));
  const h = Math.max(1, Math.min(src.height - sy, Math.round(src.height * region.h)));
  const out = new PNG({ width: w, height: h });
  PNG.bitblt(src, out, sx, sy, w, h, 0, 0);
  return out;
}

function comparePng(aPath, bPath, diffPath) {
  const a = PNG.sync.read(fs.readFileSync(aPath));
  const b = PNG.sync.read(fs.readFileSync(bPath));
  if (a.width !== b.width || a.height !== b.height) {
    return { mismatch: 1, diffPixels: a.width * a.height, totalPixels: a.width * a.height };
  }
  const diff = new PNG({ width: a.width, height: a.height });
  const diffPixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
    threshold: 0.12,
    includeAA: false,
  });
  const total = a.width * a.height;
  const mismatch = diffPixels / total;
  if (diffPath) fs.writeFileSync(diffPath, PNG.sync.write(diff));
  return { mismatch, diffPixels, totalPixels: total };
}

let failed = 0;
const summary = [];

for (const { format, orientation } of matrix) {
  const tag = `${format}-${orientation}`;
  const doc = await buildVentureBriefDoc(v, { format, orientation, skipSave: true });
  const pdfPath = path.join(outDir, `${tag}.pdf`);
  fs.writeFileSync(pdfPath, Buffer.from(doc.output("arraybuffer")));

  // Render all pages at 90 DPI for fast deterministic comparison.
  spawnSync("pdftoppm", ["-png", "-r", "90", pdfPath, path.join(outDir, tag)], {
    stdio: "ignore",
  });

  const pageFiles = fs
    .readdirSync(outDir)
    .filter((f) => /^[a-z0-9-]+-\d+\.png$/.test(f) && f.startsWith(tag + "-"))
    .sort();

  for (const pf of pageFiles) {
    const fullPath = path.join(outDir, pf);
    const fullPng = PNG.sync.read(fs.readFileSync(fullPath));

    for (const [region, rect] of Object.entries(REGIONS)) {
      const crop = cropPng(fullPng, rect);
      const cropPath = path.join(outDir, `${pf.replace(".png", "")}-${region}.png`);
      fs.writeFileSync(cropPath, PNG.sync.write(crop));

      const baselinePath = path.join(baselineDir, `${pf.replace(".png", "")}-${region}.png`);
      if (update || !fs.existsSync(baselinePath)) {
        fs.copyFileSync(cropPath, baselinePath);
        summary.push({ tag, page: pf, region, status: "baseline-written" });
        continue;
      }
      const diffPath = path.join(diffDir, `${pf.replace(".png", "")}-${region}.diff.png`);
      const { mismatch, diffPixels, totalPixels } = comparePng(baselinePath, cropPath, diffPath);
      const ok = mismatch <= 0.01; // 1% tolerance per region
      if (!ok) failed++;
      summary.push({
        tag,
        page: pf,
        region,
        status: ok ? "pass" : "fail",
        mismatch: (mismatch * 100).toFixed(3) + "%",
        diffPixels,
        totalPixels,
      });
    }
  }
}

console.table(summary);
console.log(failed === 0 ? "\n✅ Visual regression passed" : `\n❌ ${failed} region(s) failed`);
process.exit(failed === 0 ? 0 : 1);
