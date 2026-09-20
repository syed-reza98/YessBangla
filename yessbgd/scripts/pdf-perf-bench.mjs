// PDF generation perf benchmark + memory tracking.
// Run: bun scripts/pdf-perf-bench.mjs
//
// Measures wall-clock time + heapUsed delta for buildVentureBriefDoc across
// every (format × orientation) combo, plus a synthetic large multi-page
// document (10x the body content) to expose any per-page overhead growth.

import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";

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

const { ventures } = await import("../src/data/ventures.ts");
const { buildVentureBriefDoc } = await import("../src/lib/ventureBrief.ts");

const v = ventures[0];

// Synthetic large venture: inflate text fields ~10× to push page count up.
function inflate(s, n) {
  return Array(n).fill(s).join(" ");
}
const big = {
  ...v,
  longDesc: inflate(v.longDesc, 12),
  highlights: Array(40).fill(0).flatMap((_, i) => v.highlights.map((h) => `[${i}] ${h}`)),
  audience: inflate(v.audience, 8),
};

const matrix = [
  { format: "a4", orientation: "portrait" },
  { format: "a4", orientation: "landscape" },
  { format: "letter", orientation: "portrait" },
  { format: "letter", orientation: "landscape" },
];

async function bench(label, venture, opts) {
  // warm-up to populate logo + faded caches
  await buildVentureBriefDoc(venture, { ...opts, skipSave: true });
  if (global.gc) global.gc();
  const memBefore = process.memoryUsage().heapUsed;
  const t0 = performance.now();
  const runs = 5;
  let pages = 0;
  let bytes = 0;
  for (let i = 0; i < runs; i++) {
    const doc = await buildVentureBriefDoc(venture, { ...opts, skipSave: true });
    pages = doc.getNumberOfPages();
    bytes = doc.output("arraybuffer").byteLength;
  }
  const elapsed = (performance.now() - t0) / runs;
  if (global.gc) global.gc();
  const memAfter = process.memoryUsage().heapUsed;
  return {
    label,
    pages,
    avgTimeMs: +elapsed.toFixed(1),
    sizeKb: +(bytes / 1024).toFixed(1),
    heapDeltaKb: +(((memAfter - memBefore) / 1024)).toFixed(1),
  };
}

const rows = [];
for (const m of matrix) {
  rows.push(await bench(`std-${m.format}-${m.orientation}`, v, m));
}
for (const m of matrix) {
  rows.push(await bench(`big-${m.format}-${m.orientation}`, big, m));
}
console.table(rows);

const reportDir = path.resolve("reports");
fs.mkdirSync(reportDir, { recursive: true });
const md =
  `# PDF generation benchmark\n\nGenerated: ${new Date().toISOString()}\n\n` +
  `| Variant | Pages | Avg time (ms) | PDF size (KB) | Heap Δ (KB) |\n` +
  `|---|---:|---:|---:|---:|\n` +
  rows
    .map((r) => `| ${r.label} | ${r.pages} | ${r.avgTimeMs} | ${r.sizeKb} | ${r.heapDeltaKb} |`)
    .join("\n") +
  "\n";
fs.writeFileSync(path.join(reportDir, "pdf-perf.md"), md);
console.log("\nReport written to reports/pdf-perf.md");
